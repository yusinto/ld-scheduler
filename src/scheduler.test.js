jest.mock('moment', () => global.td.function('moment'));
jest.mock('config', () => ({
  appEnv: 'development',
  launchDarkly: {
    environment: 'test',
    rest: {
      baseUrl: 'mockBaseUrl',
      flags: '/flags',
    }
  }
}));
jest.mock('./constants', () => ({
  requestHeaders: 'headers',
  taskTypes: {
    killSwitch: 'killSwitch',
    fallThroughRollout: 'fallThroughRollout'
  }
}));
jest.mock('./getScheduledFlags', () => global.td.function('getScheduledFlags'));
jest.mock('./completeFlagDeployment', () => global.td.function('completeFlagDeployment'));
jest.mock('./slack', () => global.td.function('slack'));

import moment from 'moment';
import getScheduledFlags from './getScheduledFlags';
import completeFlagDeployment from './completeFlagDeployment';
import slack from './slack';

const mockMomentFormat = td.function('mockMomentFormat');
const mockMomentIsAfter = td.function('mockMomentIsAfter');

describe('Scheduler', () => {
  const scheduler = require('./scheduler').default;

  beforeEach(async() => {
    td.when(moment()).thenReturn({
      format: mockMomentFormat,
      isAfter: mockMomentIsAfter
    });
    td.when(mockMomentFormat(td.matchers.anything())).thenReturn('TestDate');
  });

  afterEach(() => {
    jest.resetAllMocks();
    td.reset();
  });

  it('does not do anything if there is no outstanding task', async() => {
    fetch.mockSuccess();
    td.when(mockMomentIsAfter(td.matchers.anything())).thenReturn(false);
    td.when(getScheduledFlags()).thenReturn([]);

    expect(fetch).not.toHaveBeenCalledWith('/url/to/slack/webhook', {
      method: 'POST',
      body: JSON.stringify({text: '[Test] Successfully switched on test-flag.'})
    });
  });

  it('patches when there is a scheduled killSwitch flag', async() => {
    // arrange
    fetch.mockSuccess();
    const scheduledFlag = {
      key: 'flag1',
      tags: ['scheduled', 'some other tag'],
      description: `{
          "taskType": "killSwitch",
          "value": true,
          "targetDeploymentDateTime": "2017-02-27 22:00", 
          "description": "Flag1 description"
        }`
    };
    const outstandingTask = {
      key: scheduledFlag.key,
      tags: scheduledFlag.tags,
      ...JSON.parse(scheduledFlag.description)
    };
    td.when(getScheduledFlags()).thenReturn([scheduledFlag]);
    td.when(mockMomentIsAfter(td.matchers.anything())).thenReturn(true);

    // act
    await scheduler();

    // assert
    expect(fetch).toHaveBeenCalledWith('mockBaseUrl/flags/flag1', {
      method: 'PATCH',
      headers: 'headers',
      body: JSON.stringify([{
        op: 'replace',
        path: '/environments/test/on',
        value: true,
      }])
    });
    td.verify(completeFlagDeployment(outstandingTask));
    td.verify(slack({isUpdateSuccessful: true, task: outstandingTask}));
  });

  it('patches when there is a scheduled fallThroughRollout flag', async() => {
    // arrange
    fetch.mockSuccess();
    const scheduledFlag = {
      key: 'flag1',
      tags: ['scheduled', 'some other tag'],
      description: `{
        "taskType": "fallThroughRollout",
        "targetDeploymentDateTime": "2017-03-30 02:33", 
        "description": "Flag1 description",
        "value": [
           {
             "variation": 0,
             "weight": 100000
           },
           {
             "variation": 1,
             "weight": 0
           }
         ]
      }`
    };
    const outstandingTask = {
      key: scheduledFlag.key,
      tags: scheduledFlag.tags,
      ...JSON.parse(scheduledFlag.description)
    };
    td.when(getScheduledFlags()).thenReturn([scheduledFlag]);
    td.when(mockMomentIsAfter(td.matchers.anything())).thenReturn(true);

    // act
    await scheduler();

    // assert
    expect(fetch).toHaveBeenCalledWith('mockBaseUrl/flags/flag1', {
      method: 'PATCH',
      headers: 'headers',
      body: JSON.stringify([{
        op: 'replace',
        path: '/environments/test/fallthrough/rollout/variations',
        value: [
          {
            variation: 0,
            weight: 100000
          },
          {
            variation: 1,
            weight: 0
          }
        ],
      }])
    });
    td.verify(completeFlagDeployment(outstandingTask));
    td.verify(slack({isUpdateSuccessful: true, task: outstandingTask}));
  });

  it('updates slack with correct message if path fails', async() => {
    // arrange
    fetch.mockSuccess({}, {status: 401, statusText: 'Unauthorized'});
    const scheduledFlag = {
      key: 'flag1',
      tags: ['scheduled', 'some other tag'],
      description: `{
        "taskType": "fallThroughRollout",
        "targetDeploymentDateTime": "2017-03-30 02:33", 
        "description": "Flag1 description",
        "value": [
           {
             "variation": 0,
             "weight": 100000
           },
           {
             "variation": 1,
             "weight": 0
           }
         ]
      }`
    };
    const outstandingTask = {
      key: scheduledFlag.key,
      tags: scheduledFlag.tags,
      ...JSON.parse(scheduledFlag.description)
    };
    td.when(getScheduledFlags()).thenReturn([scheduledFlag]);
    td.when(mockMomentIsAfter(td.matchers.anything())).thenReturn(true);

    // act
    await scheduler();

    // assert
    expect(fetch).toHaveBeenCalledWith('mockBaseUrl/flags/flag1', {
      method: 'PATCH',
      headers: 'headers',
      body: JSON.stringify([{
        op: 'replace',
        path: '/environments/test/fallthrough/rollout/variations',
        value: [
          {
            variation: 0,
            weight: 100000
          },
          {
            variation: 1,
            weight: 0
          }
        ],
      }])
    });
    td.verify(completeFlagDeployment(outstandingTask), {times: 0});
    td.verify(slack({isUpdateSuccessful: false, task: outstandingTask}));
  });
});
