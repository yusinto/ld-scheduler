import 'isomorphic-fetch';
import blueBird from 'bluebird';
import scheduler from './scheduler';

global.Promise = blueBird;

export const ldScheduler = scheduler;
export default {
  ldScheduler: scheduler
};
