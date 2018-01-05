'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _scheduler = require('./scheduler');

var _scheduler2 = _interopRequireDefault(_scheduler);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = new _log2.default('cronJob');
var cronJob = function cronJob(_ref) {
  var environment = _ref.environment,
      apiKey = _ref.apiKey,
      slack = _ref.slack,
      _ref$pollIntervalSeco = _ref.pollIntervalSeconds,
      pollIntervalSeconds = _ref$pollIntervalSeco === undefined ? 60 : _ref$pollIntervalSeco;

  log.info('ld-scheduler started. Polling interval: ' + pollIntervalSeconds + 's');
  (0, _scheduler2.default)({ environment: environment, apiKey: apiKey, slack: slack });

  setInterval(function () {
    (0, _scheduler2.default)({ environment: environment, apiKey: apiKey, slack: slack });
  }, pollIntervalSeconds * 1000);
};

exports.default = cronJob;