
const apiKey = 'secret-api-key';
const project = 'default';
const baseUrl = `https://app.launchdarkly.com/api/v2/flags/${project}`;
const headers = {
  Accept: '*/*',
  'Content-Type': 'application/json',
  Authorization: apiKey,
  'accept-encoding': 'gzip, deflate'
};

const updateFlag = async (flag) => {
  console.log('Running updateFlag...');

  // GOTCHA: Must stringify body!!!!
  const body = JSON.stringify([
    {"op": "replace", "path": "/environments/test/on", "value": true}
  ]);

  const url = `${baseUrl}/${flag}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body,
  });

  console.log(`response: ${response.status} ${response.statusText} from: ${response.url}`);
};

const listFlags = async () => {
  console.log('Running listFlags...');

  const url = `${baseUrl}?env=test`;
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  // GOTCHA: must use .json() to convert response.body to json!!!
  const data = await response.json();
  console.log(`response: ${response.status} ${response.statusText} ${JSON.stringify(data)} from: ${response.url}`);
};


// updateFlag('dev-test-flag');
listFlags();