import keyMirror from 'keymirror';

export const taskTypes = keyMirror({
  killSwitch: null,
  fallThroughRollout: null
});

export const launchDarklyFlagsEndpoint = 'https://app.launchdarkly.com/api/v2/flags/default';
