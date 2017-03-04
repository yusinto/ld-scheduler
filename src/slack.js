import {taskTypes} from './constants';
import upperFirst from 'lodash/upperFirst';
import Logger from './log';

const log = new Logger('slack');

export default async ({isUpdateSuccessful, task: {taskType, key, value}}, environment, slack) => {
  let message = `[${upperFirst(environment)}] `;

  if (taskType === taskTypes.killSwitch) {
    const onOff = value ? 'on' : 'off';
    message += isUpdateSuccessful ?
      `Successfully switched ${onOff} ${key}.`
      :
      `FAILED to switch ${onOff} ${key}. Will retry in a few minutes.`;
  } else if (taskType === taskTypes.fallThroughRollout) {
    const rolloutPercentages = `{true: ${value[0].weight / 1000}%, false: ${value[1].weight / 1000}%}`;
    message += isUpdateSuccessful ?
      `Successfully set rollout percentage to ${rolloutPercentages} for ${key}.`
      :
      `FAILED to set rollout percentage for ${key}. Will retry in a few minutes.`;
  } else {
    log.error(`Unknown task type: ${taskType}`);
    return;
  }

  const body = JSON.stringify({text: message});
  try {
    const response = await fetch(slack, {
      method: 'POST',
      body,
    });

    log.info(`Posted message on slack. Response: ${response.status} ${response.statusText} from: ${response.url}`);
  } catch (e) {
    log.error(`Network error. Could not reach Slack. Did not post to slack regarding ${isUpdateSuccessful}, ${key}: ${value}. ${e}`);
  }
};
