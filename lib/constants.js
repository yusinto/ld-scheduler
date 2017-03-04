'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.launchDarklyFlagsEndpoint = exports.taskTypes = undefined;

var _keymirror = require('keymirror');

var _keymirror2 = _interopRequireDefault(_keymirror);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var taskTypes = exports.taskTypes = (0, _keymirror2.default)({
  killSwitch: null,
  fallThroughRollout: null
});

var launchDarklyFlagsEndpoint = exports.launchDarklyFlagsEndpoint = 'https://app.launchdarkly.com/api/v2/flags/default';