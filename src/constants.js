import config from 'config';
import keyMirror from 'keymirror';

export const requestHeaders = {
  Accept: '*/*',
  'Content-Type': 'application/json',
  Authorization: config.launchDarkly.apiKey,
  'accept-encoding': 'gzip, deflate'
};

export const taskTypes = keyMirror({
  killSwitch: null,
  fallThroughRollout: null,
});
