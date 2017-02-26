import moment from 'moment';
import config from 'config';
import upperFirst from 'lodash/upperFirst';

const POLL_INTERVAL_SECONDS = 60; // 1 minute
const TASK_TYPES = {
  killSwitch: 'Sets kill switch to true or false',
  fallThroughRollout: 'Sets default rule percentage rollout',
};

const scheduledTasks = [
  {
    flag: 'new-and-old-funnel',
    taskType: TASK_TYPES.fallThroughRollout,
    value: [
      {
        variation: 0, // true
        weight: 100000, // not sure why this is in the thousands..
      },
      {
        variation: 1, // false
        weight: 0,
      }
    ],
    targetDeploymentDateTime: '2017-02-27 00:01',
    isDeployed: false,
  },
  {
    flag: 'double-points-code',
    taskType: TASK_TYPES.killSwitch,
    value: true,
    targetDeploymentDateTime: '2017-02-27 00:01',
    isDeployed: false,
  },
  {
    flag: 'marketing-campaign-home-page',
    taskType: TASK_TYPES.killSwitch,
    value: true,
    targetDeploymentDateTime: '2017-02-27 00:01',
    isDeployed: false,
  }
];
const headers = {
  Accept: '*/*',
  'Content-Type': 'application/json',
  Authorization: config.launchDarkly.apiKey,
  'accept-encoding': 'gzip, deflate'
};

// set said flag to the specified value
const run = () => {
  console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} ld-scheduler is waking up with appEnv: ${config.appEnv}, ld.environment: ${config.launchDarkly.environment}`);
  const outstandingTasks = scheduledTasks.filter(f => !f.isDeployed && moment().isAfter(moment(f.targetDeploymentDateTime, 'YYYY-MM-DD HH:mm')));

  if (outstandingTasks.length === 0) {
    console.log('Nothing to process, going back to sleep');
    return;
  }

  outstandingTasks.forEach(async(task) => {
    const {taskType, flag, value} = task;
    console.log(`Processing ${JSON.stringify(task)}`);

    let path = `/environments/${config.launchDarkly.environment}`;

    switch (taskType) {
      case TASK_TYPES.killSwitch:
        path += '/on';
        break;
      case TASK_TYPES.fallThroughRollout:
        path += '/fallthrough/rollout/variations';
        break;
      default:
        console.log(`ERROR: Unknown task type: ${taskType}`);
        return;
    }

    // GOTCHA: Must stringify body!!!!
    const body = JSON.stringify([{
      op: 'replace',
      path,
      value,
    }]);

    const url = `${config.launchDarkly.rest.baseUrl}${config.launchDarkly.rest.flags}/${flag}`;

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body,
      });

      console.log(`LaunchDarkly api response: ${response.status} ${response.statusText} from: ${response.url}`);

      if (response.status === 200) {
        task.isDeployed = true;
        console.log(`SUCCESS LD api! Updated ${flag} to ${value}.`);
        messageSlack({isUpdateSuccessful: true, task});
      } else {
        console.log(`LaunchDarkly threw an error. Did not update ${flag}. Will retry again later.`);
        messageSlack({isUpdateSuccessful: false, task});
      }
    } catch (e) {
      console.log(`Network error. Could not reach LaunchDarkly. Did not update ${flag}. Will retry again later. ${e}`);
      messageSlack({isUpdateSuccessful: false, task});
    }
  });
};

const messageSlack = async({isUpdateSuccessful, task: {taskType, flag, value}}) => {
  let message = `[${upperFirst(config.launchDarkly.environment)}] `;

  switch (taskType) {
    case TASK_TYPES.killSwitch:
      const onOff = value ? 'on' : 'off';
      message += isUpdateSuccessful ?
        `Successfully switched ${onOff} ${flag}.`
        :
        `FAILED to switch ${onOff} ${flag}. Will retry in a few minutes.`;
      break;

    case TASK_TYPES.fallThroughRollout:
      const rolloutPercentages = `{true: ${value[0].weight / 1000}%, false: ${value[1].weight / 1000}%}`;
      message += isUpdateSuccessful ?
        `Successfully set rollout percentage to ${rolloutPercentages} for ${flag}.`
        :
        `FAILED to set rollout percentage for ${flag}. Will retry in a few minutes.`;
      break;

    default:
      console.log(`ERROR: Unknown task type: ${taskType}`);
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
    console.log(`Network error. Could not reach Slack. Did not post to slack regarding ${isUpdateSuccessful}, ${flag}: ${targetValue}. ${e}`);
  }
};

// list all flags in the current project
// const listFlags = async() => {
//   console.log('Running listFlags...');
//
//   const url = `${baseUrl}?env=${environment}`;
//   const response = await fetch(url, {
//     method: 'GET',
//     headers,
//   });
//
//   // GOTCHA: must use .json() to convert response.body to json!!!
//   const data = await response.json();
//   console.log(`response: ${response.status} ${response.statusText} ${JSON.stringify(data)} from: ${response.url}`);
// };

// listFlags();
setInterval(() => {
  run();
}, POLL_INTERVAL_SECONDS * 1000);
