import {launchDarklyFlagsEndpoint} from './constants';
import getRequestHeaders from './getRequestHeaders';
import without from 'lodash/without';
import Logger from './log';

const log = new Logger('completeFlagDeployment');

export default async({key, tags, description, targetDeploymentDateTime, originalDescription}, environment, apiKey) => {
  const updatedTags = without(tags, `${environment}-scheduled`);
  const operations = [
    {
      op: 'replace',
      path: '/tags',
      value: updatedTags,
    },
  ];

  const commonAttributes = {
    op: 'replace',
    path: '/description',
  };

  Array.isArray(originalDescription) ?
    operations.push({
      ...commonAttributes,
      value: JSON.stringify([
        ...originalDescription.map((d) => {
          console.log(d);
          return {
            ...d,
            ...d.targetDeploymentDateTime === targetDeploymentDateTime ? { __isDeployed: true } : null,
          };
        }),
      ]),
    }) :
    operations.push({
      ...commonAttributes,
      value: JSON.stringify({
        ...description,
        __isDeployed: true,
      }),
    });

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
