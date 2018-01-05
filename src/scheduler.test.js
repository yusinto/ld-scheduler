jest.mock('moment', () => global.td.function('moment'));
jest.mock('./constants', () => ({
  taskTypes: {
    killSwitch: 'killSwitch',
    fallThroughRollout: 'fallThroughRollout'
  },
  launchDarklyFlagsEndpoint: 'mockBaseUrl/flags'
}));
jest.mock('./getRequestHeaders', () => global.td.function('getRequestHeaders'));
jest.mock('./getScheduledFlags', () => global.td.function('getScheduledFlags'));
jest.mock('./completeFlagDeployment', () => global.td.function('completeFlagDeployment'));
jest.mock('./slack', () => global.td.function('messageSlack'));

import moment from 'moment';
import getRequestHeaders from './getRequestHeaders';
import getScheduledFlags from './getScheduledFlags';
import completeFlagDeployment from './completeFlagDeployment';
import messageSlack from './slack';
import filterFlags from './filterFlags';


const mockMomentFormat = td.function('mockMomentFormat');
const mockMomentIsAfter = td.function('mockMomentIsAfter');

describe('Scheduler', () => {
  const scheduler = require('./scheduler').default;

  beforeEach(async() => {
    const momentObject = {
      format: mockMomentFormat,
      isAfter: mockMomentIsAfter
    };

    td.when(moment()).thenReturn(momentObject);
    td.when(moment(td.matchers.anything(), 'YYYY-MM-DD HH:mm Z')).thenReturn(momentObject);
    td.when(mockMomentFormat(td.matchers.anything())).thenReturn('TestDate');
    td.when(getRequestHeaders(td.matchers.anything())).thenReturn('headers');
  });

  afterEach(() => {
    jest.resetAllMocks();
    td.reset();
  });

  it('does not do anything if there is no outstanding task', async() => {
    fetch.mockSuccess();
    td.when(mockMomentIsAfter(td.matchers.anything())).thenReturn(false);
    td.when(getScheduledFlags(td.matchers.anything(), td.matchers.anything())).thenReturn([]);

    await scheduler({environment: 'test', apiKey: 'someKey', slack: '/url/to/slack/webhook'});

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
    td.when(getScheduledFlags(td.matchers.anything(), td.matchers.anything())).thenReturn([scheduledFlag]);
    td.when(mockMomentIsAfter(td.matchers.anything())).thenReturn(true);

    // act
    await scheduler({environment: 'test', apiKey: 'someKey', slack: '/url/to/slack/webhook'});

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
    td.verify(completeFlagDeployment(outstandingTask, 'test', 'someKey'));
    td.verify(messageSlack({isUpdateSuccessful: true, task: outstandingTask}, 'test', '/url/to/slack/webhook'));
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
    td.when(getScheduledFlags(td.matchers.anything(), td.matchers.anything())).thenReturn([scheduledFlag]);
    td.when(mockMomentIsAfter(td.matchers.anything())).thenReturn(true);

    // act
    await scheduler({environment: 'test', apiKey: 'someKey', slack: '/url/to/slack/webhook'});

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
    td.verify(completeFlagDeployment(outstandingTask, 'test', 'someKey'));
    td.verify(messageSlack({isUpdateSuccessful: true, task: outstandingTask}, 'test', '/url/to/slack/webhook'));
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
    td.when(getScheduledFlags(td.matchers.anything(), td.matchers.anything())).thenReturn([scheduledFlag]);
    td.when(mockMomentIsAfter(td.matchers.anything())).thenReturn(true);

    // act
    await scheduler({environment: 'test', apiKey: 'someKey', slack: '/url/to/slack/webhook'});

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
    td.verify(completeFlagDeployment(outstandingTask, 'someKey'), {times: 0});
    td.verify(messageSlack({isUpdateSuccessful: false, task: outstandingTask}, 'test', '/url/to/slack/webhook'));
  });

  describe('filterFlags', () => {
    it('should render correct for json object as string', () => {
      const scheduledFlag = [{
        key: 'flag1',
        tags: ['scheduled', 'some other tag'],
        description: `{
          "taskType": "fallThroughRollout",
          "targetDeploymentDateTime": "2017-03-30 02:33", 
          "description": "Flag1 description",
          "value": "test"
        }`
      }];
      td.when(mockMomentIsAfter(td.matchers.anything())).thenReturn(true);
      console.log(filterFlags(scheduledFlag));
      expect(filterFlags(scheduledFlag)).toMatchSnapshot();
    });

    it('should render correct for array as string', () => {
      const scheduledFlag = [{
        key: 'flag1',
        tags: ['scheduled', 'some other tag'],
        description: `[
          {
            "taskType": "fallThroughRollout",
            "targetDeploymentDateTime": "2017-03-30 02:33", 
            "description": "Flag1 description",
            "value": "test1"
          },
          {
            "taskType": "fallThroughRollout1",
            "targetDeploymentDateTime": "2017-03-31 02:33", 
            "description": "Flag1 description",
            "value": "test2"
          }
        ]`
      }];
      td.when(mockMomentIsAfter(td.matchers.anything())).thenReturn(true);
      expect(filterFlags(scheduledFlag)).toMatchSnapshot();
    });
  });
});
