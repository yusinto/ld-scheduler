import moment from 'moment';
import config from 'config';
import {requestHeaders, taskTypes} from './constants';
import getScheduledFlags from './getScheduledFlags';
import completeFlagDeployment from './completeFlagDeployment';
import slack from './slack';

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
     "targetDeploymentDateTime": "2017-03-30 02:33",
     "description": "Flag1 description",
     "value": [
       {
         "variation": 0,
         "weight": 100000
       },
       {
         "variation": 1,
         "weight": 0
       }
     ]
   }
 targetDeploymentDateTime must be in the format of YYYY-MM-DD HH:mm
 description is a textual description of the purpose of the flag for human readability
 */
export default async() => {
  console.log(`scheduler: ${moment().format('YYYY-MM-DD HH:mm:ss')} ld-scheduler is waking up with appEnv: ${config.appEnv}, ld.environment: ${config.launchDarkly.environment}`);
  const scheduledFlags = await getScheduledFlags();

  // get only flags that can bedeployed
  const outstandingTasks = scheduledFlags.filter(f => {
    const outstandingTask = JSON.parse(f.description);
    return moment().isAfter(moment(outstandingTask.targetDeploymentDateTime, 'YYYY-MM-DD HH:mm'));
  }).map(f => ({
    key: f.key,
    tags: f.tags,
    ...JSON.parse(f.description)
  }));

  if (outstandingTasks.length === 0) {
    console.log('scheduler: Nothing to process, going back to sleep');
    return;
  }

  outstandingTasks.forEach(async(task) => {
    const {taskType, key, value} = task;
    console.log(`scheduler: Processing ${JSON.stringify(task)}`);

    let path = `/environments/${config.launchDarkly.environment}`;

    switch (taskType) {
      case taskTypes.killSwitch:
        path += '/on';
        break;
      case taskTypes.fallThroughRollout:
        path += '/fallthrough/rollout/variations';
        break;
      default:
        console.log(`scheduler: ERROR: Unknown task type: ${taskType}`);
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

      console.log(`scheduler: LaunchDarkly api response: ${response.status} ${response.statusText} from: ${response.url}`);

      if (response.status === 200) {
        completeFlagDeployment(task);

        console.log(`scheduler: SUCCESS LD api! Updated ${key} to ${value}.`);
        slack({isUpdateSuccessful: true, task});
      } else {
        console.log(`scheduler: LaunchDarkly threw an error. Did not update ${key}. Will retry again later.`);
        slack({isUpdateSuccessful: false, task});
      }
    } catch (e) {
      console.log(`scheduler: Network error. Could not reach LaunchDarkly. Did not update ${key}. Will retry again later. ${e}`);
      slack({isUpdateSuccessful: false, task});
    }
  });
};
