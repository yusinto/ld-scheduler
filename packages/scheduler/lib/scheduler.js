'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _constants = require('./constants');

var _getRequestHeaders = require('./getRequestHeaders');

var _getRequestHeaders2 = _interopRequireDefault(_getRequestHeaders);

var _getScheduledFlags = require('./getScheduledFlags');

var _getScheduledFlags2 = _interopRequireDefault(_getScheduledFlags);

var _completeFlagDeployment = require('./completeFlagDeployment');

var _completeFlagDeployment2 = _interopRequireDefault(_completeFlagDeployment);

var _slack = require('./slack');

var _slack2 = _interopRequireDefault(_slack);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var log = new _log2.default('scheduler');

/*
 To use this scheduler, you'll need to add one or more 'scheduled' tags to your feature flag, each prefixed with the environment name.
 For example, if you have both a test and production environment, you will need 2 tags: 'test-scheduled' and 'production-scheduled'.
 Then you'll need to add a json object to the description field of that flag. That json object should look like this:
 {
 "taskType": "killSwitch",
 "value": true,
 "targetDeploymentDateTime": "2017-02-27 22:00 +11:00",
 "description": "Test flag for dev"
 }

 where
 taskType can be killSwitch OR fallThroughRollout
 value
 is true or false if taskType is killSwitch
 OR
 a json object of this shape if taskType is fallThroughRollout:
 {
 "taskType": "fallThroughRollout",
 "targetDeploymentDateTime": "2017-03-3 02:33 +11:00",
 "description": "Flag1 description",
 "value": [
 {
 "variation": 0,
 "weight": 90000
 },
 {
 "variation": 1,
 "weight": 10000
 }
 ]
 }
 targetDeploymentDateTime must be in the format of YYYY-MM-DD HH:mm +hh:mm
 description is a textual description of the purpose of the flag for human readability
 */

exports.default = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(_ref2) {
    var environment = _ref2.environment,
        apiKey = _ref2.apiKey,
        slack = _ref2.slack;
    var scheduledFlags, outstandingTasks;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            log.info('ld-scheduler is waking up in ld.environment: ' + environment);
            _context2.next = 3;
            return (0, _getScheduledFlags2.default)(environment, apiKey);

          case 3:
            scheduledFlags = _context2.sent;


            // get only flags that can be deployed
            outstandingTasks = scheduledFlags.filter(function (f) {
              var outstandingTaskList = void 0;
              try {
                outstandingTaskList = JSON.parse(f.description);

                if (!Array.isArray(outstandingTaskList)) {
                  outstandingTaskList = [outstandingTaskList];
                }

                var currentDateTime = (0, _moment2.default)();
                var targetDeploymentDateTime = (0, _moment2.default)(outstandingTaskList.targetDeploymentDateTime, 'YYYY-MM-DD HH:mm Z');
                var isScheduledTimePassed = currentDateTime.isAfter(targetDeploymentDateTime);

                log.info('Found scheduled flag ' + f.key + ' with targetDeploymentDateTime: ' + targetDeploymentDateTime.format() + '. isScheduledTimePassed: ' + isScheduledTimePassed);
                return isScheduledTimePassed;
              } catch (e) {
                log.error(f.key + ' is scheduled, but its description field is not a valid json object: ' + f.description);
                return false;
              }
            }).map(function (f) {
              return _extends({
                key: f.key,
                tags: f.tags
              }, JSON.parse(f.description));
            });

            if (!(outstandingTasks.length === 0)) {
              _context2.next = 8;
              break;
            }

            log.info('Nothing to process, going back to sleep');
            return _context2.abrupt('return');

          case 8:

            outstandingTasks.forEach(function () {
              var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(task) {
                var taskType, key, value, path, body, url, response;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        taskType = task.taskType, key = task.key, value = task.value;

                        log.info('Processing ' + JSON.stringify(task));

                        path = '/environments/' + environment;
                        _context.t0 = taskType;
                        _context.next = _context.t0 === _constants.taskTypes.killSwitch ? 6 : _context.t0 === _constants.taskTypes.fallThroughRollout ? 8 : 10;
                        break;

                      case 6:
                        path += '/on';
                        return _context.abrupt('break', 12);

                      case 8:
                        path += '/fallthrough/rollout/variations';
                        return _context.abrupt('break', 12);

                      case 10:
                        log.error('ERROR: Unknown task type: ' + taskType);
                        return _context.abrupt('return');

                      case 12:
                        body = JSON.stringify([{
                          op: 'replace',
                          path: path,
                          value: value
                        }]);
                        url = _constants.launchDarklyFlagsEndpoint + '/' + key;
                        _context.prev = 14;
                        _context.next = 17;
                        return fetch(url, {
                          method: 'PATCH',
                          headers: (0, _getRequestHeaders2.default)(apiKey),
                          body: body
                        });

                      case 17:
                        response = _context.sent;


                        log.info('LaunchDarkly api response: ' + response.status + ' ' + response.statusText + ' from: ' + response.url);

                        if (response.status === 200) {
                          (0, _completeFlagDeployment2.default)(task, environment, apiKey);

                          log.info('SUCCESS LD api! Updated ' + key + ' to ' + JSON.stringify(value) + '.');
                          (0, _slack2.default)({ isUpdateSuccessful: true, task: task }, environment, slack);
                        } else {
                          log.info('LaunchDarkly threw an error. Did not update ' + key + '. Will retry again later.');
                          (0, _slack2.default)({ isUpdateSuccessful: false, task: task }, environment, slack);
                        }
                        _context.next = 26;
                        break;

                      case 22:
                        _context.prev = 22;
                        _context.t1 = _context['catch'](14);

                        log.error('Network error. Could not reach LaunchDarkly. Did not update ' + key + '. Will retry again later. ' + _context.t1);
                        (0, _slack2.default)({ isUpdateSuccessful: false, task: task }, environment, slack);

                      case 26:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, undefined, [[14, 22]]);
              }));

              return function (_x2) {
                return _ref3.apply(this, arguments);
              };
            }());

          case 9:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();