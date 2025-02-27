const prettyms = require('pretty-ms');
const axios = require('axios').default;
var jsonminify = require("jsonminify");

let messageSize;

// creates plain text message for slack
function slackMessage(stats, timings, failures, executions, maxMessageSize, collection, environment, channel, reportingUrl, limitFailures) {
    messageSize = maxMessageSize;
    let parsedFailures = parseFailures(failures);
    let skipCount = getSkipCount(executions);

    // Build info section for collection/environment/reporting URL
    let infoSection = "";
    if (collection) {
        infoSection += `Collection: ${collection}\n`;
        if (environment) {
            infoSection += `Environment: ${environment}\n`;
        }
    }
    if (reportingUrl) {
        infoSection += `Reporting URL: ${reportingUrl}\n`;
    }

    // Build test summary text
    let summaryText = "*Test Summary*\n";
    summaryText += `Total Tests: ${stats.requests.total}\n`;
    summaryText += `Test Passed: ${stats.requests.total - parsedFailures.length - skipCount}\n`;
    summaryText += `Test Failed: ${parsedFailures.length}\n`;
    summaryText += `Test Skipped: ${skipCount}\n`;
    summaryText += `Test Duration: ${prettyms(timings.completed - timings.started)}\n\n`;
    summaryText += `Assertions: Total: ${stats.assertions.total}  Failed: ${stats.assertions.failed}\n`;

    // Build failure or success message
    let detailsText = "";
    if (failures.length > 0) {
        detailsText += ":fire: Failures :fire:\n";
        // If limitFailures is set, only include up to that many failure groups
        if (limitFailures > 0) {
            detailsText += failMessage(parsedFailures.splice(0, limitFailures));
        } else {
            detailsText += failMessage(parsedFailures);
        }
    } else {
        detailsText += ":white_check_mark: All Passed :white_check_mark:\n";
    }

    // Combine all text parts
    let resultText = "";
    if (infoSection) resultText += infoSection + "\n";
    resultText += summaryText + "\n" + detailsText;

    // Return a JSON payload with a "channel" and a "result" key
    return jsonminify(`
    {
        "channel": "${channel}",
        "result": "${resultText}"
    }`);
}

function collectionAndEnvironentFileBlock(collection, environment) {
    // No longer used since we’re now sending all info as text.
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
