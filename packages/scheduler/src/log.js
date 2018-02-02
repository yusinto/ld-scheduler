import moment from 'moment';

export default class Logger {
  static LOG_LEVELS = {error: 10, warn: 20, info: 30, log: 40};

  constructor(moduleName) {
    this.moduleName = moduleName;
    this.consoleWriter = ::this.consoleWriter;
    this.log = ::this.log;
    this.info = ::this.info;
    this.warn = ::this.warn;
    this.error = ::this.error;
  }

  consoleWriter(level, ...args) {
    const sanitisedModuleName = this.moduleName ? `[${this.moduleName}]` : '';
    console[level](`${moment().format()} ${level.toUpperCase()} ${sanitisedModuleName}`, ...args);
  }

  log(...args) {
    this.consoleWriter('log', ...args);
  }

  info(...args) {
    this.consoleWriter('info', ...args);
  }

  warn(...args) {
    this.consoleWriter('warn', ...args);
  }

  error(...args) {
    this.consoleWriter('error', ...args);
  }
}
