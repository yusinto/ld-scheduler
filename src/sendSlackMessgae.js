import Logger from './log';

const log = new Logger('slack');

export default async (message, slack, errorMessage) => {
  const body = JSON.stringify({text: message});
  try {
    const response = await fetch(slack, {
      method: 'POST',
      body,
    });

    log.info(`Posted message on slack. Response: ${response.status} ${response.statusText} from: ${response.url}`);
  } catch (e) {
    log.error(`${errorMessage || message}${e}`);
  }
};
