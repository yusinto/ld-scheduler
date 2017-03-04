import moment from 'moment';
import {taskTypes, launchDarklyFlagsEndpoint} from './constants';
import getRequestHeaders from './getRequestHeaders';
import getScheduledFlags from './getScheduledFlags';
import completeFlagDeployment from './completeFlagDeployment';
import messageSlack from './slack';
import Logger from './log';

const log = new Logger('scheduler');

/*
 To use this scheduler, you'll need to add a tag to your feature flag called "scheduled" and then add a json object
 to the description field of that flag. That json object should look like this:
 {
 "taskType": "killSwitch",
 "value": true,
 "targetDeploymentDateTime": "2017-02-27 22:00",
 "description": "Test flag for dev"
 }

 where
 taskType can be killSwitch OR fallThroughRollout
 value
 is true or false if taskType is killSwitch
 OR
 a json object of this shape if taskType is fallThroughRollout:
 {
 "taskType": "fallThroughRollout",
 "targetDeploymentDateTime": "2017-03-3 02:33",
 "description": "Flag1 description",
 "value": [
 {
 "variation": 0,
 "weight": 90000
 },
 {
 "variation": 1,
 "weight": 10000
 }
 ]
 }
 targetDeploymentDateTime must be in the format of YYYY-MM-DD HH:mm
 description is a textual description of the purpose of the flag for human readability
 */
export default async({environment, apiKey, slack}) => {
  log.info(`ld-scheduler is waking up in ld.environment: ${environment}`);
  const scheduledFlags = await getScheduledFlags(environment, apiKey);

  // get only flags that can be deployed
  const outstandingTasks = scheduledFlags.filter(f => {
    let outstandingTask;
    try {
      outstandingTask = JSON.parse(f.description);
      return moment().isAfter(moment(outstandingTask.targetDeploymentDateTime, 'YYYY-MM-DD HH:mm'));
    } catch (e) {
      log.error(`${f.key} is scheduled, but its description field is not a valid json object: ${f.description}`);
      return false;
    }
  }).map(f => ({
    key: f.key,
    tags: f.tags,
    ...JSON.parse(f.description)
  }));

  if (outstandingTasks.length === 0) {
    log.info(`Nothing to process, going back to sleep`);
    return;
  }

  outstandingTasks.forEach(async(task) => {
    const {taskType, key, value} = task;
    log.info(`Processing ${JSON.stringify(task)}`);

    let path = `/environments/${environment}`;

    switch (taskType) {
      case taskTypes.killSwitch:
        path += '/on';
        break;
      case taskTypes.fallThroughRollout:
        path += '/fallthrough/rollout/variations';
        break;
      default:
        log.error(`ERROR: Unknown task type: ${taskType}`);
        return;
    }

    const body = JSON.stringify([{
      op: 'replace',
      path,
      value,
    }]);

    const url = `${launchDarklyFlagsEndpoint}/${key}`;

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: getRequestHeaders(apiKey),
        body,
      });

      log.info(`LaunchDarkly api response: ${response.status} ${response.statusText} from: ${response.url}`);

      if (response.status === 200) {
        completeFlagDeployment(task, apiKey);

        log.info(`SUCCESS LD api! Updated ${key} to ${JSON.stringify(value)}.`);
        messageSlack({isUpdateSuccessful: true, task}, environment, slack);
      } else {
        log.info(`LaunchDarkly threw an error. Did not update ${key}. Will retry again later.`);
        messageSlack({isUpdateSuccessful: false, task}, environment, slack);
      }
    } catch (e) {
      log.error(`Network error. Could not reach LaunchDarkly. Did not update ${key}. Will retry again later. ${e}`);
      messageSlack({isUpdateSuccessful: false, task}, environment, slack);
    }
  });
};
