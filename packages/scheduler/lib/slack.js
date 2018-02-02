'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _constants = require('./constants');

var _upperFirst = require('lodash/upperFirst');

var _upperFirst2 = _interopRequireDefault(_upperFirst);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var log = new _log2.default('slack');

exports.default = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(_ref2, environment, slack) {
    var isUpdateSuccessful = _ref2.isUpdateSuccessful,
        _ref2$task = _ref2.task,
        taskType = _ref2$task.taskType,
        key = _ref2$task.key,
        value = _ref2$task.value;
    var message, onOff, rolloutPercentages, body, response;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            message = '[' + (0, _upperFirst2.default)(environment) + '] ';

            if (!(taskType === _constants.taskTypes.killSwitch)) {
              _context.next = 6;
              break;
            }

            onOff = value ? 'on' : 'off';

            message += isUpdateSuccessful ? 'Successfully switched ' + onOff + ' ' + key + '.' : 'FAILED to switch ' + onOff + ' ' + key + '. Will retry in a few minutes.';
            _context.next = 13;
            break;

          case 6:
            if (!(taskType === _constants.taskTypes.fallThroughRollout)) {
              _context.next = 11;
              break;
            }

            rolloutPercentages = '{true: ' + value[0].weight / 1000 + '%, false: ' + value[1].weight / 1000 + '%}';

            message += isUpdateSuccessful ? 'Successfully set rollout percentage to ' + rolloutPercentages + ' for ' + key + '.' : 'FAILED to set rollout percentage for ' + key + '. Will retry in a few minutes.';
            _context.next = 13;
            break;

          case 11:
            log.error('Unknown task type: ' + taskType);
            return _context.abrupt('return');

          case 13:
            body = JSON.stringify({ text: message });
            _context.prev = 14;
            _context.next = 17;
            return fetch(slack, {
              method: 'POST',
              body: body
            });

          case 17:
            response = _context.sent;


            log.info('Posted message on slack. Response: ' + response.status + ' ' + response.statusText + ' from: ' + response.url);
            _context.next = 24;
            break;

          case 21:
            _context.prev = 21;
            _context.t0 = _context['catch'](14);

            log.error('Network error. Could not reach Slack. Did not post to slack regarding ' + isUpdateSuccessful + ', ' + key + ': ' + value + '. ' + _context.t0);

          case 24:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[14, 21]]);
  }));

  return function (_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();