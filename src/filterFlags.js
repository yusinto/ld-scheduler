import isValidDateAfter from './isValidDateAfter';
import sendSlackMessage from './sendSlackMessgae';

export default function filterFlags(scheduledFlags, slack) {
  let description = '';
  // get only flags that can be deployed
  return scheduledFlags
    .reduce((accumulator, f) => {
      try {
        description = JSON.parse(f.description);
      } catch (e) {
        const message = `${f.key} is scheduled, but its description field is not a valid json object: ${f.description}`;
        return sendSlackMessage(message, slack);
      }

      return Array.isArray(description) ? [
        ...accumulator,
        ...description.map(value => {
          if (!isValidDateAfter(value)) return null;

          log.info(`Found scheduled flag ${f.key}`);
          return {
            key: f.key,
            tags: f.tags,
            ...value,
            originalDescription: description,
          };
        }),
      ] : [
        ...accumulator,
        {
          key: f.key,
          tags: f.tags,
          ...description,
        },
      ];
    }, []).filter(Boolean);
}
