# newman-reporter-slackmsgforworkflows

[Forked]: Whats the difference? This is updated for slack workflow webhooks instead.
You can capture the following variables in the workflow webhook
- total_tests
- tests_passed
- tests_failed
- tests_skipped
- test_duration
- assertions_total
- assertions_failed
- details
[Original]: https://github.com/jackcoded/newman-reporter-slackmsg

Custom [Newman](https://github.com/postmanlabs/newman) reporter to send message to [Slack](https://slack.com/)

<img src="https://github.com/jackcoded/newman-reporter-slackmsg/blob/master/testResults.png?raw=true" width="450"  height="550">

## Before you get started
- Install [Newman](https://github.com/postmanlabs/newman) ``` $ npm run i -g newman ```
- Create a [Slack incoming webhook url](https://api.slack.com/messaging/webhooks)
or
- Create a [Slack bot to send to channel or user dynamically](https://api.slack.com/messaging/sending)

## Installation
 Add to package.json
```"newman-reporter-slackmsgforworkflows": "git+https://github.com/rzhangasana/newman-reporter-slackmsg-for-workflows.git"```
and then npm install

## Usage
```CLI
 newman run <collectionFile> -e <environmentFile> --suppress-exit-code -r slackmsgforworkflows --reporter-slackmsgforworkflows-webhookurl '<webhookurl>'
```

## Reporter Options Optionals
```
 --reporter-slackmsgforworkflows-messageSize '<messageSize>' e.g 150
 --reporter-slackmsgforworkflows-token '<bearer token>' e.g xoxb-XXXXXXXXXXXX-TTTTTTTTTTTTTT
 --reporter-slackmsgforworkflows-channel '<channel>' e.g #general
 --reporter-slackmsgforworkflows-failuresChannel '<channel>' e.g. #alerts
 --reporter-slackmsgforworkflows-collection '<collectionName> e.g test.json
 --reporter-slackmsgforworkflows-environment '<environmentName> e.g env.json
 --reporter-slackmsgforworkflows-reportingurl '<URL> e.g https://127.0.1/index.html
  --reporter-slackmsgforworkflows-limitFailures '<limitFailures>; e.g 5

```


## Reporter Options
**webhookurl** 
Webhook URL to point to the slack api where results are published

**collection** 
Option to add the name of collection file onto the message

**environment**
Option to add the name of environment file onto the message

**messageSize**
Option to change the message size, defaulted to 100

**token**
Option to use bearer token for slack bots for channel override

**channel**
Option to select channel or user receive the result

**failuresChannel**
Option to select channel or user to receive failures

**limitFailures**
Option to limit the amount failures shown in slack

