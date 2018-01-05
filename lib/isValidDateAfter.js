'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isValidDateAfter;

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isValidDateAfter(outstandingTask) {
  var currentDateTime = (0, _moment2.default)();
  var targetDeploymentDateTime = (0, _moment2.default)(outstandingTask.targetDeploymentDateTime, 'YYYY-MM-DD HH:mm Z');
  console.log('with targetDeploymentDateTime: ' + targetDeploymentDateTime.format() + '.');
  return currentDateTime.isAfter(targetDeploymentDateTime) && !outstandingTask.__isDeployed;
}