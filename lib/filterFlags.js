'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = filterFlags;

var _isValidDateAfter = require('./isValidDateAfter');

var _isValidDateAfter2 = _interopRequireDefault(_isValidDateAfter);

var _sendSlackMessgae = require('./sendSlackMessgae');

var _sendSlackMessgae2 = _interopRequireDefault(_sendSlackMessgae);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function filterFlags(scheduledFlags, slack) {
  var description = '';
  // get only flags that can be deployed
  return scheduledFlags.reduce(function (accumulator, f) {
    try {
      description = JSON.parse(f.description);
    } catch (e) {
      var message = f.key + ' is scheduled, but its description field is not a valid json object: ' + f.description;
      return (0, _sendSlackMessgae2.default)(message, slack);
    }

    return Array.isArray(description) ? [].concat(_toConsumableArray(accumulator), _toConsumableArray(description.map(function (value) {
      if (!(0, _isValidDateAfter2.default)(value)) return null;

      log.info('Found scheduled flag ' + f.key);
      return _extends({
        key: f.key,
        tags: f.tags
      }, value, {
        originalDescription: description
      });
    }))) : [].concat(_toConsumableArray(accumulator), [_extends({
      key: f.key,
      tags: f.tags
    }, description)]);
  }, []).filter(Boolean);
}