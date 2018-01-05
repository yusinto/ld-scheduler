import {launchDarklyFlagsEndpoint} from './constants';
import getRequestHeaders from './getRequestHeaders';
import Logger from './log';

const log = new Logger('getScheduledFlags');

// list all scheduled flags in the default project
export default async(environment, apiKey) => {
  const url = `${launchDarklyFlagsEndpoint}?env=${environment}&tag=${environment}-scheduled`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getRequestHeaders(apiKey),
    });

    if (response.status === 200) {
      const data = await response.json();
      return data.items;
    }

    log.error(`api response: ${response.status} ${response.statusText} from: ${response.url}`);
    return [];
  } catch (e) {
    log.error(`${e}. Will retry again later.`);
    return [];
  }
};
