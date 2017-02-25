import moment from 'moment';
import config from 'config';

const scheduledTasks = [
  {
    flag: 'double-points-code',
    value: true,
    targetDeploymentDateTime: '2017-02-27 12:01',
    isDeployed: false,
  },
  {
    flag: 'marketing-campaign-home-page',
    value: true,
    targetDeploymentDateTime: '2017-02-27 12:01',
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

  outstandingTasks.forEach(async(f) => {
    const {flag, value} = f;
    console.log(`Processing ${JSON.stringify(f)}`);

    // GOTCHA: Must stringify body!!!!
    const body = JSON.stringify([{
      op: 'replace',
      path: `/environments/${config.launchDarkly.environment}/on`,
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
        f.isDeployed = true;
        console.log(`SUCCESS LD api! Updated ${flag} to ${value}.`);
        messageSlack({isUpdateSuccessful: true, flag, value});
      } else {
        console.log(`LaunchDarkly threw an error. Did not update ${flag}. Will retry again later.`);
        messageSlack({isUpdateSuccessful: false, flag, value});
      }
    } catch (e) {
      console.log(`Network error. Could not reach LaunchDarkly. Did not update ${flag}. Will retry again later. ${e}`);
      messageSlack({isUpdateSuccessful: false, flag, value});
    }
  });
};

const messageSlack = async ({isUpdateSuccessful, flag, value}) => {
  let message;
  const onOff = value ? 'on' : 'off';

  if (isUpdateSuccessful) {
    message = `Successfully switched ${onOff} ${flag}.`;
  } else {
    message = `FAILED to switch ${onOff} ${flag}. Will retry in a few minutes.`;
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
}, 3000);
