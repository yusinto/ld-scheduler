'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (apiKey) {
  return {
    Accept: '*/*',
    'Content-Type': 'application/json',
    Authorization: apiKey,
    'accept-encoding': 'gzip, deflate'
  };
};