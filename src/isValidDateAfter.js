import moment from 'moment';

export default function isValidDateAfter(outstandingTask) {
  const currentDateTime = moment();
  const targetDeploymentDateTime = moment(outstandingTask.targetDeploymentDateTime, 'YYYY-MM-DD HH:mm Z');
  console.log(`with targetDeploymentDateTime: ${targetDeploymentDateTime.format()}.`);
  return currentDateTime.isAfter(targetDeploymentDateTime) && !outstandingTask.__isDeployed;
}