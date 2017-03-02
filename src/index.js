import 'isomorphic-fetch';
import blueBird from 'bluebird';
import cronJob from './cronJob';

global.Promise = blueBird;

export const ldScheduler = cronJob;
export default {
  ldScheduler: cronJob
};
