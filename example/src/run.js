import ldScheduler from '../../lib';

ldScheduler.runEveryXSeconds({
  environment: 'test',
  apiKey: 'your-secret-api-key',
  slack: 'your-slack-webhook-url'
});
