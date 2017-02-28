import moment from 'moment';
import config from 'config';
import {requestHeaders, taskTypes} from 'constants';
import getScheduledFlags from 'getScheduledFlags';
import completeFlagDeployment from 'completeFlagDeployment';
import slack from 'slack';

/*
 To use this scheduler, you'll need to add a tag to your feature flag called "scheduled" and then add a json object
 to the description field of that flag. That json object should look like this:
 {
 "taskType": "killSwitch",
 "value": true,
 "targetDeploymentDateTime": "2017-02-27 22:00",
 "description": "Test flag for dev"
 }

 where:
 taskType can be one of killSwitch or fallThroughRollout
 value can be:
 true or false if taskType is killSwitch OR
 a json object of this shape if taskType is fallThroughRollout:
 [
 {
 variation: 0, // true
 weight: 100000,
 },
 {
 variation: 1, // false
 weight: 0,
 }
 ]
 targetDeploymentDateTime must be in the format of YYYY-MM-DD HH:mm
 description is a textual description of the purpose of the flag for human readability
 */
const POLL_INTERVAL_SECONDS = 60; // 1 minute

const main = async() => {
  console.log(`main: ${moment().format('YYYY-MM-DD HH:mm:ss')} ld-scheduler is waking up with appEnv: ${config.appEnv}, ld.environment: ${config.launchDarkly.environment}`);
  const scheduledFlags = await getScheduledFlags();

  // get only flags that can bedeployed
  let outstandingTasks = scheduledFlags.filter(f => {
    const outstandingTask = JSON.parse(f.description);
    return moment().isAfter(moment(outstandingTask.targetDeploymentDateTime, 'YYYY-MM-DD HH:mm'));
  }).map(f => {
    return {
      key: f.key,
      tags: f.tags,
      ...JSON.parse(f.description)
    }
  });

  if (outstandingTasks.length === 0) {
    console.log('main: Nothing to process, going back to sleep');
    return;
  }

  outstandingTasks.forEach(async(task) => {
    const {taskType, key, value} = task;
    console.log(`main: Processing ${JSON.stringify(task)}`);

    let path = `/environments/${config.launchDarkly.environment}`;

    switch (taskType) {
      case taskTypes.killSwitch:
        path += '/on';
        break;
      case taskTypes.fallThroughRollout:
        path += '/fallthrough/rollout/variations';
        break;
      default:
        console.log(`main: ERROR: Unknown task type: ${taskType}`);
        return;
    }

    const body = JSON.stringify([{
      op: 'replace',
      path,
      value,
    }]);

    const url = `${config.launchDarkly.rest.baseUrl}${config.launchDarkly.rest.flags}/${key}`;

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: requestHeaders,
        body,
      });

      console.log(`main: LaunchDarkly api response: ${response.status} ${response.statusText} from: ${response.url}`);

      if (response.status === 200) {
        completeFlagDeployment(task);

        console.log(`main: SUCCESS LD api! Updated ${key} to ${value}.`);
        slack({isUpdateSuccessful: true, task});
      } else {
        console.log(`main: LaunchDarkly threw an error. Did not update ${key}. Will retry again later.`);
        slack({isUpdateSuccessful: false, task});
      }
    } catch (e) {
      console.log(`main: Network error. Could not reach LaunchDarkly. Did not update ${key}. Will retry again later. ${e}`);
      slack({isUpdateSuccessful: false, task});
    }
  });
};

console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} ld-scheduler started with appEnv: ${config.appEnv}, ld.environment: ${config.launchDarkly.environment}`);
main();

setInterval(() => {
  main();
}, POLL_INTERVAL_SECONDS * 1000);
