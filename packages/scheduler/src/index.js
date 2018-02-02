import 'isomorphic-fetch';
import blueBird from 'bluebird';
import cronJob from './cronJob';
import scheduler from './scheduler';

global.Promise = blueBird;

export default {
  runOnce: scheduler,
  runEveryXSeconds: cronJob
};
