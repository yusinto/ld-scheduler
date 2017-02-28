import config from 'config';
import {requestHeaders} from 'constants';

// list all scheduled flags in the default project
export default getScheduledFlags = async() => {
  const url = `${config.launchDarkly.rest.baseUrl}${config.launchDarkly.rest.flags}?env=${config.launchDarkly.environment}&tag=scheduled`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: requestHeaders,
    });

    const data = await response.json();
    return data.items;
  } catch (e) {
    console.log(`getScheduledFlags: ERROR: ${e}. Will retry again later.`);
    return [];
  }
};