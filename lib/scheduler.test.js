'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _getRequestHeaders = require('./getRequestHeaders');

var _getRequestHeaders2 = _interopRequireDefault(_getRequestHeaders);

var _getScheduledFlags = require('./getScheduledFlags');

var _getScheduledFlags2 = _interopRequireDefault(_getScheduledFlags);

var _completeFlagDeployment = require('./completeFlagDeployment');

var _completeFlagDeployment2 = _interopRequireDefault(_completeFlagDeployment);

var _slack = require('./slack');

var _slack2 = _interopRequireDefault(_slack);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

jest.mock('moment', function () {
  return global.td.function('moment');
});
jest.mock('config', function () {
  return {
    appEnv: 'development',
    launchDarkly: {
      environment: 'test',
      rest: {
        baseUrl: 'mockBaseUrl',
        flags: '/flags'
      }
    }
  };
});
jest.mock('./constants', function () {
  return {
    taskTypes: {
      killSwitch: 'killSwitch',
      fallThroughRollout: 'fallThroughRollout'
    }
  };
});
jest.mock('./getRequestHeaders', function () {
  return global.td.function('getRequestHeaders');
});
jest.mock('./getScheduledFlags', function () {
  return global.td.function('getScheduledFlags');
});
jest.mock('./completeFlagDeployment', function () {
  return global.td.function('completeFlagDeployment');
});
jest.mock('./slack', function () {
  return global.td.function('slack');
});

var mockMomentFormat = td.function('mockMomentFormat');
var mockMomentIsAfter = td.function('mockMomentIsAfter');

describe('Scheduler', function () {
  var scheduler = require('./scheduler').default;

  beforeEach(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            td.when((0, _moment2.default)()).thenReturn({
              format: mockMomentFormat,
              isAfter: mockMomentIsAfter
            });
            td.when(mockMomentFormat(td.matchers.anything())).thenReturn('TestDate');
            td.when((0, _getRequestHeaders2.default)(td.matchers.anything())).thenReturn('headers');

          case 3:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  })));

  afterEach(function () {
    jest.resetAllMocks();
    td.reset();
  });

  it('does not do anything if there is no outstanding task', _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            fetch.mockSuccess();
            td.when(mockMomentIsAfter(td.matchers.anything())).thenReturn(false);
            td.when((0, _getScheduledFlags2.default)(td.matchers.anything(), td.matchers.anything())).thenReturn([]);

            _context2.next = 5;
            return scheduler({ ldEnvironment: 'test', apiKey: 'someKey', slackWebhook: '/url/to/slack/webhook' });

          case 5:

            expect(fetch).not.toHaveBeenCalledWith('/url/to/slack/webhook', {
              method: 'POST',
              body: JSON.stringify({ text: '[Test] Successfully switched on test-flag.' })
            });

          case 6:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  })));

  it('patches when there is a scheduled killSwitch flag', _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
    var scheduledFlag, outstandingTask;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            // arrange
            fetch.mockSuccess();
            scheduledFlag = {
              key: 'flag1',
              tags: ['scheduled', 'some other tag'],
              description: '{\n          "taskType": "killSwitch",\n          "value": true,\n          "targetDeploymentDateTime": "2017-02-27 22:00", \n          "description": "Flag1 description"\n        }'
            };
            outstandingTask = _extends({
              key: scheduledFlag.key,
              tags: scheduledFlag.tags
            }, JSON.parse(scheduledFlag.description));

            td.when((0, _getScheduledFlags2.default)(td.matchers.anything(), td.matchers.anything())).thenReturn([scheduledFlag]);
            td.when(mockMomentIsAfter(td.matchers.anything())).thenReturn(true);

            // act
            _context3.next = 7;
            return scheduler({ ldEnvironment: 'test', apiKey: 'someKey', slackWebhook: '/url/to/slack/webhook' });

          case 7:

            // assert
            expect(fetch).toHaveBeenCalledWith('mockBaseUrl/flags/flag1', {
              method: 'PATCH',
              headers: 'headers',
              body: JSON.stringify([{
                op: 'replace',
                path: '/environments/test/on',
                value: true
              }])
            });
            td.verify((0, _completeFlagDeployment2.default)(outstandingTask));
            td.verify((0, _slack2.default)({ isUpdateSuccessful: true, task: outstandingTask }, 'test', '/url/to/slack/webhook'));

          case 10:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  })));

  it('patches when there is a scheduled fallThroughRollout flag', _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
    var scheduledFlag, outstandingTask;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            // arrange
            fetch.mockSuccess();
            scheduledFlag = {
              key: 'flag1',
              tags: ['scheduled', 'some other tag'],
              description: '{\n        "taskType": "fallThroughRollout",\n        "targetDeploymentDateTime": "2017-03-30 02:33", \n        "description": "Flag1 description",\n        "value": [\n           {\n             "variation": 0,\n             "weight": 100000\n           },\n           {\n             "variation": 1,\n             "weight": 0\n           }\n         ]\n      }'
            };
            outstandingTask = _extends({
              key: scheduledFlag.key,
              tags: scheduledFlag.tags
            }, JSON.parse(scheduledFlag.description));

            td.when((0, _getScheduledFlags2.default)(td.matchers.anything(), td.matchers.anything())).thenReturn([scheduledFlag]);
            td.when(mockMomentIsAfter(td.matchers.anything())).thenReturn(true);

            // act
            _context4.next = 7;
            return scheduler({ ldEnvironment: 'test', apiKey: 'someKey', slackWebhook: '/url/to/slack/webhook' });

          case 7:

            // assert
            expect(fetch).toHaveBeenCalledWith('mockBaseUrl/flags/flag1', {
              method: 'PATCH',
              headers: 'headers',
              body: JSON.stringify([{
                op: 'replace',
                path: '/environments/test/fallthrough/rollout/variations',
                value: [{
                  variation: 0,
                  weight: 100000
                }, {
                  variation: 1,
                  weight: 0
                }]
              }])
            });
            td.verify((0, _completeFlagDeployment2.default)(outstandingTask));
            td.verify((0, _slack2.default)({ isUpdateSuccessful: true, task: outstandingTask }, 'test', '/url/to/slack/webhook'));

          case 10:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  })));

  it('updates slack with correct message if path fails', _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
    var scheduledFlag, outstandingTask;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            // arrange
            fetch.mockSuccess({}, { status: 401, statusText: 'Unauthorized' });
            scheduledFlag = {
              key: 'flag1',
              tags: ['scheduled', 'some other tag'],
              description: '{\n        "taskType": "fallThroughRollout",\n        "targetDeploymentDateTime": "2017-03-30 02:33", \n        "description": "Flag1 description",\n        "value": [\n           {\n             "variation": 0,\n             "weight": 100000\n           },\n           {\n             "variation": 1,\n             "weight": 0\n           }\n         ]\n      }'
            };
            outstandingTask = _extends({
              key: scheduledFlag.key,
              tags: scheduledFlag.tags
            }, JSON.parse(scheduledFlag.description));

            td.when((0, _getScheduledFlags2.default)(td.matchers.anything(), td.matchers.anything())).thenReturn([scheduledFlag]);
            td.when(mockMomentIsAfter(td.matchers.anything())).thenReturn(true);

            // act
            _context5.next = 7;
            return scheduler({ ldEnvironment: 'test', apiKey: 'someKey', slackWebhook: '/url/to/slack/webhook' });

          case 7:

            // assert
            expect(fetch).toHaveBeenCalledWith('mockBaseUrl/flags/flag1', {
              method: 'PATCH',
              headers: 'headers',
              body: JSON.stringify([{
                op: 'replace',
                path: '/environments/test/fallthrough/rollout/variations',
                value: [{
                  variation: 0,
                  weight: 100000
                }, {
                  variation: 1,
                  weight: 0
                }]
              }])
            });
            td.verify((0, _completeFlagDeployment2.default)(outstandingTask), { times: 0 });
            td.verify((0, _slack2.default)({ isUpdateSuccessful: false, task: outstandingTask }, 'test', '/url/to/slack/webhook'));

          case 10:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, undefined);
  })));
});