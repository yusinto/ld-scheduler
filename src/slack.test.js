jest.mock('config', () => ({
  launchDarkly: {
    environment: 'test',
    rest: {
      baseUrl: 'mockBaseUrl',
      flags: '/flags',
    }
  },
  slack: '/url/to/slack/webhook'
}));

describe('Slack', () => {
  const slack = require('./slack').default;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns correct message for turning on kill switch', async() => {
    await slack({
      isUpdateSuccessful: true,
      task: {
        taskType: 'killSwitch',
        key: 'test-flag',
        value: true
      }
    });

    expect(fetch).toHaveBeenCalledWith('/url/to/slack/webhook', {
      method: 'POST',
      body: JSON.stringify({text: '[Test] Successfully switched on test-flag.'})
    });
  });

  it('returns correct message for turning off kill switch', async() => {
    await slack({
      isUpdateSuccessful: true,
      task: {
        taskType: 'killSwitch',
        key: 'test-flag',
        value: false
      }
    });

    expect(fetch).toHaveBeenCalledWith('/url/to/slack/webhook', {
      method: 'POST',
      body: JSON.stringify({text: '[Test] Successfully switched off test-flag.'})
    });
  });

  it('returns correct message for updating rollout percentage', async() => {
    await slack({
      isUpdateSuccessful: true,
      task: {
        taskType: 'fallThroughRollout',
        key: 'test-flag',
        value: [
          {
            variation: 0, // true
            weight: 70000,
          },
          {
            variation: 1, // false
            weight: 30000,
          }
        ]
      }
    });

    expect(fetch).toHaveBeenCalledWith('/url/to/slack/webhook', {
      method: 'POST',
      body: JSON.stringify({text: '[Test] Successfully set rollout percentage to {true: 70%, false: 30%} for test-flag.'})
    });
  });


  it('returns correct message for failing turning on kill switch', async() => {
    await slack({
      isUpdateSuccessful: false,
      task: {
        taskType: 'killSwitch',
        key: 'test-flag',
        value: true
      }
    });

    expect(fetch).toHaveBeenCalledWith('/url/to/slack/webhook', {
      method: 'POST',
      body: JSON.stringify({text: '[Test] FAILED to switch on test-flag. Will retry in a few minutes.'})
    });
  });

  it('returns correct message for failing to turning off kill switch', async() => {
    await slack({
      isUpdateSuccessful: false,
      task: {
        taskType: 'killSwitch',
        key: 'test-flag',
        value: false
      }
    });

    expect(fetch).toHaveBeenCalledWith('/url/to/slack/webhook', {
      method: 'POST',
      body: JSON.stringify({text: '[Test] FAILED to switch off test-flag. Will retry in a few minutes.'})
    });
  });

  it('returns correct message for updating rollout percentage', async() => {
    await slack({
      isUpdateSuccessful: false,
      task: {
        taskType: 'fallThroughRollout',
        key: 'test-flag',
        value: [
          {
            variation: 0, // true
            weight: 70000,
          },
          {
            variation: 1, // false
            weight: 30000,
          }
        ]
      }
    });

    expect(fetch).toHaveBeenCalledWith('/url/to/slack/webhook', {
      method: 'POST',
      body: JSON.stringify({text: '[Test] FAILED to set rollout percentage for test-flag. Will retry in a few minutes.'})
    });
  });
});
