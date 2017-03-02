'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

jest.mock('config', function () {
  return {
    launchDarkly: {
      environment: 'test',
      rest: {
        baseUrl: 'mockBaseUrl',
        flags: '/flags'
      }
    },
    slack: '/url/to/slack/webhook'
  };
});

describe('Slack', function () {
  var slack = require('./slack').default;

  beforeEach(function () {
    fetch.mockSuccess();
  });

  afterEach(function () {
    jest.resetAllMocks();
  });

  it('returns correct message for turning on kill switch', _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return slack({
              isUpdateSuccessful: true,
              task: {
                taskType: 'killSwitch',
                key: 'test-flag',
                value: true
              }
            }, 'test', '/url/to/slack/webhook');

          case 2:

            expect(fetch).toHaveBeenCalledWith('/url/to/slack/webhook', {
              method: 'POST',
              body: JSON.stringify({ text: '[Test] Successfully switched on test-flag.' })
            });

          case 3:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  })));

  it('returns correct message for turning off kill switch', _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return slack({
              isUpdateSuccessful: true,
              task: {
                taskType: 'killSwitch',
                key: 'test-flag',
                value: false
              }
            }, 'test', '/url/to/slack/webhook');

          case 2:

            expect(fetch).toHaveBeenCalledWith('/url/to/slack/webhook', {
              method: 'POST',
              body: JSON.stringify({ text: '[Test] Successfully switched off test-flag.' })
            });

          case 3:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  })));

  it('returns correct message for updating rollout percentage', _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return slack({
              isUpdateSuccessful: true,
              task: {
                taskType: 'fallThroughRollout',
                key: 'test-flag',
                value: [{
                  variation: 0, // true
                  weight: 70000
                }, {
                  variation: 1, // false
                  weight: 30000
                }]
              }
            }, 'test', '/url/to/slack/webhook');

          case 2:

            expect(fetch).toHaveBeenCalledWith('/url/to/slack/webhook', {
              method: 'POST',
              body: JSON.stringify({ text: '[Test] Successfully set rollout percentage to {true: 70%, false: 30%} for test-flag.' })
            });

          case 3:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  })));

  it('returns correct message for failing turning on kill switch', _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return slack({
              isUpdateSuccessful: false,
              task: {
                taskType: 'killSwitch',
                key: 'test-flag',
                value: true
              }
            }, 'test', '/url/to/slack/webhook');

          case 2:

            expect(fetch).toHaveBeenCalledWith('/url/to/slack/webhook', {
              method: 'POST',
              body: JSON.stringify({ text: '[Test] FAILED to switch on test-flag. Will retry in a few minutes.' })
            });

          case 3:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  })));

  it('returns correct message for failing to turning off kill switch', _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return slack({
              isUpdateSuccessful: false,
              task: {
                taskType: 'killSwitch',
                key: 'test-flag',
                value: false
              }
            }, 'test', '/url/to/slack/webhook');

          case 2:

            expect(fetch).toHaveBeenCalledWith('/url/to/slack/webhook', {
              method: 'POST',
              body: JSON.stringify({ text: '[Test] FAILED to switch off test-flag. Will retry in a few minutes.' })
            });

          case 3:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, undefined);
  })));

  it('returns correct message for updating rollout percentage', _asyncToGenerator(regeneratorRuntime.mark(function _callee6() {
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return slack({
              isUpdateSuccessful: false,
              task: {
                taskType: 'fallThroughRollout',
                key: 'test-flag',
                value: [{
                  variation: 0, // true
                  weight: 70000
                }, {
                  variation: 1, // false
                  weight: 30000
                }]
              }
            }, 'test', '/url/to/slack/webhook');

          case 2:

            expect(fetch).toHaveBeenCalledWith('/url/to/slack/webhook', {
              method: 'POST',
              body: JSON.stringify({ text: '[Test] FAILED to set rollout percentage for test-flag. Will retry in a few minutes.' })
            });

          case 3:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, undefined);
  })));
});