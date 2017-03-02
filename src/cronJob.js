import moment from 'moment';
import scheduler from './scheduler';

const POLL_INTERVAL_SECONDS = 60; // 1 minute

const cronJob = ({ldEnvironment, apiKey, slackWebhook}) => {
  console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} ld-scheduler started in ld.environment: ${ldEnvironment}`);
  scheduler({ldEnvironment, apiKey, slackWebhook});

  setInterval(() => {
    scheduler({ldEnvironment, apiKey, slackWebhook});
  }, POLL_INTERVAL_SECONDS * 1000);
};

export default cronJob;
