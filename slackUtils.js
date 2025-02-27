const prettyms = require('pretty-ms');
const axios = require('axios').default;
var jsonminify = require("jsonminify");

let messageSize;

// creates plain text message for slack in key/value pairs
function slackMessage(stats, timings, failures, executions, maxMessageSize, collection, environment, channel, reportingUrl, limitFailures) {
    messageSize = maxMessageSize;
    let parsedFailures = parseFailures(failures);
    let skipCount = getSkipCount(executions);

    // Build info section for collection/environment/reporting URL
    let info = {};
    if (collection) {
        info.collection = collection;
        if (environment) {
            info.environment = environment;
        }
    }
    if (reportingUrl) {
        info.reporting_url = reportingUrl;
    }

    // Build summary object
    const summary = {
        total_tests: stats.requests.total,
        tests_passed: stats.requests.total - parsedFailures.length - skipCount,
        tests_failed: parsedFailures.length,
        tests_skipped: skipCount,
        test_duration: prettyms(timings.completed - timings.started),
        assertions_total: stats.assertions.total,
        assertions_failed: stats.assertions.failed
    };

    // Build details message for failures or success
    let details = "";
    if (failures.length > 0) {
        details += ":fire: Failures :fire:\n";
        if (limitFailures > 0) {
            details += failMessage(parsedFailures.splice(0, limitFailures));
        } else {
            details += failMessage(parsedFailures);
        }
    } else {
        details += ":white_check_mark: All Passed :white_check_mark:";
    }

    // Build the payload as an object with individual keys
    const payload = Object.assign({}, info, summary, {
        details: details,
        channel: channel
    });

    // Return the JSON payload (minified if you wish)
    return JSON.stringify(payload, null, 4);
}

function collectionAndEnvironentFileBlock(collection, environment) {
    // No longer used since we’re now sending all info as key/value pairs.
    return '';
}

function reportingUrlSection(reportingUrl) {
    // No longer used.
    return '';
}

function getSkipCount(executions) {
    return executions.reduce((acc, execution) => {
        if (execution.assertions && execution.assertions[0].skipped) {
            acc = acc + 1;
        }
        return acc;
    }, 0);
}

// Takes fail report and parse it for further processing
function parseFailures(failures) {
    return failures.reduce((acc, failure, index) => {
        if (index === 0) {
            acc.push({
                name: failure.source.name || 'No Name',
                tests: [{
                    name: failure.error.name || 'No test name',
                    test: failure.error.test || 'connection error',
                    message: failure.error.message || 'No Error Message'
                }]
            });
        } else if (acc[acc.length - 1].name !== failure.source.name) {
            acc.push({
                name: failure.source.name || 'No Name',
                tests: [{
                    name: failure.error.name || 'No test name',
                    test: failure.error.test || 'connection error',
                    message: failure.error.message || 'No Error Message'
                }]
            });
        } else {
            acc[acc.length - 1].tests.push({
                name: failure.error.name || 'No test name',
                test: failure.error.test || 'connection error',
                message: failure.error.message || 'No Error Message'
            });
        }
        return acc;
    }, []);
}

// Takes parsedFailures and create failMessages as plain text
function failMessage(parsedFailures) {
    return parsedFailures.map((failure) => {
        return `*${failure.name}*\n${failErrors(failure.tests)}\n`;
    }).join("\n");
}

// Takes error messages and create plain text for each failure
function failErrors(parsedErrors) {
    return parsedErrors.map((error, index) => {
        return `${index + 1}. ${error.name} - ${error.test}\n• ${cleanErrorMessage(error.message, messageSize)}`;
    }).join("\n");
}

function cleanErrorMessage(message, maxMessageSize) {
    let filteredMessage = message.replace(/["']/g, "");
    filteredMessage = filteredMessage.replace('expected', 'Expected -');
    if (filteredMessage.length > maxMessageSize) {
        return `${filteredMessage.substring(0, maxMessageSize)}...`;
    }
    return filteredMessage;
}

// sends the message to slack via POST to webhook url
async function send(url, message, token) {
    const payload = {
        method: 'POST',
        url,
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        data: message
    };
    let result;
    try {
        result = await axios(payload);
    } catch (e) {
        result = false;
        console.error(`Error in sending message to slack ${e}`);
    }
    return result;
}

exports.slackUtils = {
    send,
    slackMessage
};
