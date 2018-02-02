'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _class, _temp;

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Logger = (_temp = _class = function () {
  function Logger(moduleName) {
    _classCallCheck(this, Logger);

    this.moduleName = moduleName;
    this.consoleWriter = this.consoleWriter.bind(this);
    this.log = this.log.bind(this);
    this.info = this.info.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
  }

  _createClass(Logger, [{
    key: 'consoleWriter',
    value: function consoleWriter(level) {
      var _console;

      var sanitisedModuleName = this.moduleName ? '[' + this.moduleName + ']' : '';

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      (_console = console)[level].apply(_console, [(0, _moment2.default)().format() + ' ' + level.toUpperCase() + ' ' + sanitisedModuleName].concat(args));
    }
  }, {
    key: 'log',
    value: function log() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      this.consoleWriter.apply(this, ['log'].concat(args));
    }
  }, {
    key: 'info',
    value: function info() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      this.consoleWriter.apply(this, ['info'].concat(args));
    }
  }, {
    key: 'warn',
    value: function warn() {
      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      this.consoleWriter.apply(this, ['warn'].concat(args));
    }
  }, {
    key: 'error',
    value: function error() {
      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      this.consoleWriter.apply(this, ['error'].concat(args));
    }
  }]);

  return Logger;
}(), _class.LOG_LEVELS = { error: 10, warn: 20, info: 30, log: 40 }, _temp);
exports.default = Logger;