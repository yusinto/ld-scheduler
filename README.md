# ld-scheduler

[![npm version](https://img.shields.io/npm/v/ld-scheduler.svg?style=flat-square)](https://www.npmjs.com/package/ld-scheduler) [![npm downloads](https://img.shields.io/npm/dm/ld-scheduler.svg?style=flat-square)](https://www.npmjs.com/package/ld-scheduler) [![npm](https://img.shields.io/npm/dt/ld-scheduler.svg?style=flat-square)](https://www.npmjs.com/package/ld-scheduler) [![npm](https://img.shields.io/npm/l/ld-scheduler.svg?style=flat-square)](https://www.npmjs.com/package/ld-scheduler) 

> **A library to schedule launch darkly feature flag deployment** :alarm_clock:

So you use [Launch Darkly](https://launchdarkly.com/faq.html) for feature flagging and a/b testing which is very cool. Why this package then you ask?

Once you have created your feature flags in launch darkly, and then developed and tested your feature, you are now ready to deploy your code to production.
You will then also need to turn on your feature flags in production. You can do this at deploy time, either manually through the dashboard or programmatically 
through the launch darkly rest apis. However, what if your feature needs to be deployed at a later time? You need to decouple the deployment 
of your app from the deployment of your features. Enter ld-scheduler.

You can now create flags in launch darkly and then set a date and time you want the kill switch to be turned on or off. This decouples your app deployment
from feature deployment. No one should stay up past midnight just to turn on/off the kill switch.

 * Schedule feature flags on or off at an exact date and time (useful for zero dark thirty deployments)  
 * Decouple code deployment from feature deployment
 * Works with slack! Ld-scheduler posts a message to slack when it successfully updates (or fails to update) your flags!

## Installation

yarn add ld-scheduler

or the old school way

npm i --save ld-scheduler

## Quickstart

1. Create a new node project and set it up with babel. You'll need babel-register, babel-polyfill and babel-preset-latest. 
See [here](https://github.com/yusinto/ld-scheduler/tree/master/example) for example.

2. In your main code file, import ld-scheduler and call the runEveryXSeconds function. 
If you don't use slack (you should!) you don't have to specify the slack property. 
By default, ld-scheduler polls launch darkly every 60 seconds:
    ```javascript
    import ldScheduler from 'ld-scheduler';
    
    ldScheduler.runEveryXSeconds({
      environment: 'test',
      apiKey: 'your-secret-api-key',
      slack: 'your-slack-webhook-url'
    });
    ```

3. Tag your feature flag. In launch darkly's dashboard, under the Settings tab of your feature flag, under Tags, add a tag called "scheduled". 
Still in the Settings tab, under Description, add the following JSON object:

    ```javascript
    {
       "taskType": "killSwitch",
       "value": true,
       "targetDeploymentDateTime": "2017-02-27 22:00 +11:00",
       "description": "Test flag for dev"
    }
    ``` 
    **where**
    
     * taskType is killSwitch
     * value is true (kill switch on) or false (kill switch off)
     * targetDeploymentDateTime must be in the format of YYYY-MM-DD HH:mm Z
       **Note**: the utc offset is important otherwise moment will use the host's timezone. 
     * description is a textual string for the purpose of human readability

    The screenshot below is an example configuration:
  
    ![ld-scheduler-flag-settings](https://cloud.githubusercontent.com/assets/1593077/23701757/3af4af60-044c-11e7-93e7-749175789ebe.png)

4. Run your project and watch magic happens!

## Example
Check [example](https://github.com/yusinto/ld-scheduler/tree/master/example) for a fully working example. 
Remember you'll need to enter your own launch darkly api key and your own slack url (if you use slack).


