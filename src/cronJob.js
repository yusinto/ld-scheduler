import moment from 'moment';
import config from 'config';
import scheduler from './scheduler';

const POLL_INTERVAL_SECONDS = 60; // 1 minute

console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} ld-scheduler started with appEnv: ${config.appEnv}, ld.environment: ${config.launchDarkly.environment}`);
scheduler();

setInterval(() => {
  scheduler();
}, POLL_INTERVAL_SECONDS * 1000);
