import config from 'config';
import getRequestHeaders from './getRequestHeaders';

// list all scheduled flags in the default project
export default async(ldEnvironment, apiKey) => {
  const url = `${config.launchDarkly.rest.baseUrl}${config.launchDarkly.rest.flags}?env=${ldEnvironment}&tag=scheduled`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getRequestHeaders(apiKey),
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
