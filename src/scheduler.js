import moment from 'moment';
import { taskTypes, launchDarklyFlagsEndpoint } from './constants';
import getRequestHeaders from './getRequestHeaders';
import getScheduledFlags from './getScheduledFlags';
import completeFlagDeployment from './completeFlagDeployment';
import messageSlack from './slack';
import Logger from './log';

const log = new Logger('scheduler');

/*
 To use this scheduler, you'll need to add one or more 'scheduled' tags to your feature flag, each prefixed with the environment name.
 For example, if you have both a test and production environment, you will need 2 tags: 'test-scheduled' and 'production-scheduled'.
 Then you'll need to add a json object to the description field of that flag. That json object should look like this:
 {
 "taskType": "killSwitch",
 "value": true,
 "targetDeploymentDateTime": "2017-02-27 22:00 +11:00",
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
 "targetDeploymentDateTime": "2017-03-3 02:33 +11:00",
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
 targetDeploymentDateTime must be in the format of YYYY-MM-DD HH:mm +hh:mm
 description is a textual description of the purpose of the flag for human readability
 */

function isValidDateAfter(outstandingTask) {
  const currentDateTime = moment();
  const targetDeploymentDateTime = moment(outstandingTask.targetDeploymentDateTime, 'YYYY-MM-DD HH:mm Z');
  console.log(`with targetDeploymentDateTime: ${targetDeploymentDateTime.format()}.`);
  return currentDateTime.isAfter(targetDeploymentDateTime) && !outstandingTask.__isDeployed;
}

export function filterRequiredFilters(scheduledFlags) {
  // get only flags that can be deployed

  console.log('ALL', scheduledFlags);

  return scheduledFlags
    .filter(f => {
      let outstandingTask;
      try {
        outstandingTask = JSON.parse(f.description);

        if (Array.isArray(outstandingTask)) return true;

        const isScheduledTimePassed = isValidDateAfter(outstandingTask);

        log.info(`Found scheduled flag ${f.key} isScheduledTimePassed: ${isScheduledTimePassed}`);
        return isScheduledTimePassed;
      } catch (e) {
        log.error(`${f.key} is scheduled, but its description field is not a valid json object: ${f.description}`);
        return false;
      }
    })
    .reduce((accumulator, f) => {
      const description = JSON.parse(f.description);

      if (Array.isArray(description)) {
        return [
          ...accumulator,
          ...description.map(value => {
            if (!isValidDateAfter(value)) return null;

            return {
              key: f.key,
              tags: f.tags,
              ...value,
              originalDescription: description,
            };
          }),
        ];
      }

      return [
        ...accumulator,
        {
          key: f.key,
          tags: f.tags,
          ...description,
        },
      ];
    }, []).filter(Boolean);
}

export default async ({ environment, apiKey, slack }) => {
  log.info(`ld-scheduler is waking up in ld.environment: ${environment}`);
  const scheduledFlags = await getScheduledFlags(environment, apiKey);
  const outstandingTasks = filterRequiredFilters(scheduledFlags);

  console.log('outstandingTasks ______', outstandingTasks);

  if (outstandingTasks.length === 0) {
    log.info(`Nothing to process, going back to sleep`);
    return;
  }

  outstandingTasks.forEach(async task => {
    const { taskType, key, value } = task;
    log.info(`Processing ${JSON.stringify(task)}`);

    console.log('**************');
    console.log('task', task);
    console.log('**************');

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

    const body = JSON.stringify([
      {
        op: 'replace',
        path,
        value,
      },
    ]);

    const url = `${launchDarklyFlagsEndpoint}/${key}`;

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: getRequestHeaders(apiKey),
        body,
      });

      log.info(`LaunchDarkly api response: ${response.status} ${response.statusText} from: ${response.url}`);

      if (response.status === 200) {
        completeFlagDeployment(task, environment, apiKey);

        log.info(`SUCCESS LD api! Updated ${key} to ${JSON.stringify(value)}.`);
        // messageSlack({ isUpdateSuccessful: true, task }, environment, slack);
      } else {
        log.info(`LaunchDarkly threw an error. Did not update ${key}. Will retry again later.`);
        messageSlack({ isUpdateSuccessful: false, task }, environment, slack);
      }
    } catch (e) {
      log.error(`Network error. Could not reach LaunchDarkly. Did not update ${key}. Will retry again later. ${e}`);
      messageSlack({ isUpdateSuccessful: false, task }, environment, slack);
    }
  });
};
