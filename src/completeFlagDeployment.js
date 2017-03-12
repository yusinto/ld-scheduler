import {launchDarklyFlagsEndpoint} from './constants';
import getRequestHeaders from './getRequestHeaders';
import without from 'lodash/without';
import Logger from './log';

const log = new Logger('completeFlagDeployment');

export default async({key, tags, description}, environment, apiKey) => {
  const updatedTags = without(tags, `${environment}-scheduled`);
  const operations = [
    {
      op: 'replace',
      path: '/tags',
      value: updatedTags,
    },
  ];

  const remainingScheduledTags = updatedTags.filter(tag => tag.endsWith('-scheduled'));

  if (remainingScheduledTags.length === 0) {
    operations.push({
      op: 'replace',
      path: '/description',
      value: description,
    });
  }

  const body = JSON.stringify(operations);
  const url = `${launchDarklyFlagsEndpoint}/${key}`;

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getRequestHeaders(apiKey),
      body,
    });

    log.info(`LaunchDarkly api response: ${response.status} ${response.statusText} from: ${response.url}`);

    if (response.status === 200) {
      log.info(`SUCCESS LD api! Updated ${key} to ${body}.`);
    } else {
      log.error(`LaunchDarkly threw an error. Did not update ${key}. Will retry again later.`);
    }
  } catch (e) {
    log.error(`Network error. Could not reach LaunchDarkly. Did not update ${key}. Will retry again later. ${e}`);
  }
};
