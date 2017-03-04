import scheduler from './scheduler';
import Logger from './log';

const log = new Logger('cronJob');
const cronJob = ({environment, apiKey, slack, pollIntervalSeconds = 60}) => {
  log.info(`ld-scheduler started. Polling interval: ${pollIntervalSeconds}s`);
  scheduler({environment, apiKey, slack});

  const delayedCode = () => setInterval(() => {
    scheduler({environment, apiKey, slack});
  }, pollIntervalSeconds * 1000);

  setTimeout(delayedCode, 60 * 1000);
};

export default cronJob;
