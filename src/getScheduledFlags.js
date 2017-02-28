import config from 'config';
import {requestHeaders} from './constants';

// list all scheduled flags in the default project
export default async() => {
  const url = `${config.launchDarkly.rest.baseUrl}${config.launchDarkly.rest.flags}?env=${config.launchDarkly.environment}&tag=scheduled`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: requestHeaders,
    });

    if (response.status === 200) {
      const data = await response.json();
      return data.items;
    }

    console.log(`getScheduledFlag ERROR: api response: ${response.status} ${response.statusText} from: ${response.url}`);
    return [];
  } catch (e) {
    console.log(`getScheduledFlags EXCEPTION: ${e}. Will retry again later.`);
    return [];
  }
};
