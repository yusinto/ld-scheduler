import moment from 'moment';
import config from 'config';

const updateList = [
  {
    flag: 'dev-test-flag',
    value: true,
    from: '2017-02-24 23:00',
    to: '2017-02-24 23:02', // TODO: update flag after we passed the 'to' date
    isDeployed: false, // TODO: retrieve flag value from launch darkly to ascertain its value so we don't need this property
  },
];
const headers = {
  Accept: '*/*',
  'Content-Type': 'application/json',
  Authorization: config.launchDarkly.apiKey,
  'accept-encoding': 'gzip, deflate'
};

// set said flag to the specified value
const run = () => {
  console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} lds is waking up...`);
  const undeployedFlags = updateList.filter(f => !f.isDeployed && moment().isAfter(moment(f.from, 'YYYY-MM-DD HH:mm')));

  if (undeployedFlags.length === 0) {
    console.log('Nothing to process, going back to sleep');
    return;
  }

  undeployedFlags.forEach(async(f) => {
    const {flag, value} = f;
    console.log(`Processing ${JSON.stringify(f)}`);

    // GOTCHA: Must stringify body!!!!
    const body = JSON.stringify([{
      op: 'replace',
      path: `/environments/${config.launchDarkly.environment}/on`,
      value,
    }]);

    const url = `${config.launchDarkly.rest.baseUrl}${config.launchDarkly.rest.flags}/${flag}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body,
    });

    console.log(`Response: ${response.status} ${response.statusText} from: ${response.url}`);

    if (response.status === 200) {
      f.isDeployed = true;
      console.log(`Successfully updated ${flag} to ${value}. `);
    } else {
      console.log(`Error occurred. Did not update ${flag}. Will retry again later.`);
    }
  });
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
