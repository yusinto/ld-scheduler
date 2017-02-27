import moment from 'moment';
import config from 'config';
import upperFirst from 'lodash/upperFirst';
import without from 'lodash/without';
import keyMirror from 'keymirror';

const POLL_INTERVAL_SECONDS = 60; // 1 minute
export const TASK_TYPES = keyMirror({
  killSwitch: null,
  fallThroughRollout: null,
});
const headers = {
  Accept: '*/*',
  'Content-Type': 'application/json',
  Authorization: config.launchDarkly.apiKey,
  'accept-encoding': 'gzip, deflate'
};

// list all flags in the current project
const getScheduledFlags = async() => {
  const url = `${config.launchDarkly.rest.baseUrl}${config.launchDarkly.rest.flags}?env=${config.launchDarkly.environment}&tag=scheduled`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return data.items;
  } catch (e) {
    console.log(`getScheduledFlags: ERROR: ${e}. Will retry again later.`);
    return [];
  }
};

const main = async() => {
  console.log(`main: ${moment().format('YYYY-MM-DD HH:mm:ss')} ld-scheduler is waking up with appEnv: ${config.appEnv}, ld.environment: ${config.launchDarkly.environment}`);
  const scheduledFlags = await getScheduledFlags();

  /*
   HACK: use flag.description field to store scheduled task details in launchDarkly's database in this format:
   {
   "taskType": "killSwitch",
   "value": true,
   "targetDeploymentDateTime": "2017-02-27 22:00",
   "description": "Test flag for dev"
   }
   */
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
      case TASK_TYPES.killSwitch:
        path += '/on';
        break;
      case TASK_TYPES.fallThroughRollout:
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
        headers,
        body,
      });

      console.log(`main: LaunchDarkly api response: ${response.status} ${response.statusText} from: ${response.url}`);

      if (response.status === 200) {
        completeFlagDeployment(task);

        console.log(`main: SUCCESS LD api! Updated ${key} to ${value}.`);
        messageSlack({isUpdateSuccessful: true, task});
      } else {
        console.log(`main: LaunchDarkly threw an error. Did not update ${key}. Will retry again later.`);
        messageSlack({isUpdateSuccessful: false, task});
      }
    } catch (e) {
      console.log(`main: Network error. Could not reach LaunchDarkly. Did not update ${key}. Will retry again later. ${e}`);
      messageSlack({isUpdateSuccessful: false, task});
    }
  });
};

const completeFlagDeployment = async({key, tags, description}) => {
  const body = JSON.stringify([
    {
      op: 'replace',
      path: '/tags',
      value: without(tags, 'scheduled'),
    },
    {
      op: 'replace',
      path: '/description',
      value: description,
    }
  ]);

  const url = `${config.launchDarkly.rest.baseUrl}${config.launchDarkly.rest.flags}/${key}`;

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body,
    });

    console.log(`completeFlagDeployment: LaunchDarkly api response: ${response.status} ${response.statusText} from: ${response.url}`);

    if (response.status === 200) {
      console.log(`completeFlagDeployment: SUCCESS LD api! Updated ${key} to ${body}.`);
    } else {
      console.log(`completeFlagDeployment: LaunchDarkly threw an error. Did not update ${key}. Will retry again later.`);
    }
  } catch (e) {
    console.log(`completeFlagDeployment: Network error. Could not reach LaunchDarkly. Did not update ${key}. Will retry again later. ${e}`);
  }
};

const messageSlack = async({isUpdateSuccessful, task: {taskType, key, value}}) => {
  let message = `[${upperFirst(config.launchDarkly.environment)}] `;

  switch (taskType) {
    case TASK_TYPES.killSwitch:
      const onOff = value ? 'on' : 'off';
      message += isUpdateSuccessful ?
        `Successfully switched ${onOff} ${key}.`
        :
        `FAILED to switch ${onOff} ${key}. Will retry in a few minutes.`;
      break;

    case TASK_TYPES.fallThroughRollout:
      const rolloutPercentages = `{true: ${value[0].weight / 1000}%, false: ${value[1].weight / 1000}%}`;
      message += isUpdateSuccessful ?
        `Successfully set rollout percentage to ${rolloutPercentages} for ${key}.`
        :
        `FAILED to set rollout percentage for ${key}. Will retry in a few minutes.`;
      break;

    default:
      console.log(`Slack ERROR: Unknown task type: ${taskType}`);
      return;
  }

  const body = JSON.stringify({
    text: message,
  });

  try {
    const response = await fetch(config.slack, {
      method: 'POST',
      body,
    });

    console.log(`Posted message on slack. Response: ${response.status} ${response.statusText} from: ${response.url}`);
  } catch (e) {
    console.log(`Network error. Could not reach Slack. Did not post to slack regarding ${isUpdateSuccessful}, ${key}: ${targetValue}. ${e}`);
  }
};

// listFlags();

console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} ld-scheduler started with appEnv: ${config.appEnv}, ld.environment: ${config.launchDarkly.environment}`);
main();

setInterval(() => {
  main();
}, POLL_INTERVAL_SECONDS * 1000);
