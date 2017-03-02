import config from 'config';
import getRequestHeaders from './getRequestHeaders';
import without from 'lodash/without';

export default async({key, tags, description}, apiKey) => {
  const body = JSON.stringify([
    {
      op: 'replace',
      path: '/tags',
      value: without(tags, 'scheduled'),
    },
    {
      op: 'replace',
      path: '/description',
      value: description,
    }
  ]);

  const url = `${config.launchDarkly.rest.baseUrl}${config.launchDarkly.rest.flags}/${key}`;

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getRequestHeaders(apiKey),
      body,
    });

    console.log(`completeFlagDeployment: LaunchDarkly api response: ${response.status} ${response.statusText} from: ${response.url}`);

    if (response.status === 200) {
      console.log(`completeFlagDeployment: SUCCESS LD api! Updated ${key} to ${body}.`);
    } else {
      console.log(`completeFlagDeployment: LaunchDarkly threw an error. Did not update ${key}. Will retry again later.`);
    }
  } catch (e) {
    console.log(`completeFlagDeployment: Network error. Could not reach LaunchDarkly. Did not update ${key}. Will retry again later. ${e}`);
  }
};
