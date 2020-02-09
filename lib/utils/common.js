/*
 * SPDX-License-Identifier: GNU GENERAL PUBLIC LICENSE 2.0
 */

'use strict';

// Import lib
const hfc = require('fabric-client');
const promClient = require('prom-client');

const logger = require('./logger').getLogger('akc-node-sdk');

// Config
hfc.setLogger(logger);

// Declare sigleton variables
global.CLIENT = null;
global.CHANNEL = null;

/**
 * FUNCTION SECTION
 */

/**
 * Get an instance of client initialized with the network end points
 * @param {string} orgName
 * @param {boolean} isRefresh
 */
const getClientForOrg = async (orgName, isRefresh) => {
    logger.debug('getClientForOrg - ****** START %s', orgName);

    // Check current singleton value
    if (!isRefresh && CLIENT) {
        return CLIENT;
    }

    orgName = orgName || process.env.ORG_NAME;

    const client = hfc.loadFromConfig(hfc.getConfigSetting(`network-connection-profile-path`));
    client.loadFromConfig(hfc.getConfigSetting(`${orgName}-connection-profile-path`));

    await client.initCredentialStores();

    // Set singleton value
    CLIENT = client

    logger.debug('getClientForOrg - ****** END %s \n\n', orgName);

    return client;
}

/**
 * Get a Channel instance from the client instance.
 * @param {string} orgName 
 * @param {string} channelName 
 * @param {boolean} isRefresh
 */
const getChannel = async (orgName, channelName, isRefresh) => {
    logger.debug('getChannel - ****** START %s %s %s', orgName, channelName);

    // Check current singleton value
    if (!isRefresh && CHANNEL) {
        return CHANNEL;
    }

    orgName = orgName || process.env.ORG_NAME;
    channelName = channelName || process.env.CHANNEL_NAME;

    if (!CLIENT) {
        await getClientForOrg(orgName);
    }
    CHANNEL = CLIENT.getChannel(channelName);
    return CHANNEL;
};

/**
 * Declare prometheus' Histograms and Counters to measure duration metrics when sending the request.
 */
const requestCounter = new promClient.Counter({
    name: 'akc_request_count',
    help: 'Counter of requests'
}),
sendTransactionTotalHistogram = new promClient.Histogram({
    name: 'akc_send_transaction_total_duration',
    help: 'Histogram of send transaction total duration',
    labelNames: ['channel', 'chaincode', 'function']
}),
sendProposalHistogram = new promClient.Histogram({
    name: 'akc_send_proposal_duration',
    help: 'Histogram of send proposal duration',
    labelNames: ['channel', 'chaincode', 'function']
}),
sendTransactionHistogram = new promClient.Histogram({
    name: 'akc_send_transaction_duration',
    help: 'Histogram of send transaction duration',
    labelNames: ['channel', 'chaincode', 'function']
}),
errorRequestCounter = new promClient.Counter({
    name: 'akc_error_request_count',
    help: 'Counter of error requests'
});

exports.getClientForOrg = getClientForOrg;
exports.getChannel = getChannel;
exports.requestCounter = requestCounter;
exports.sendTransactionTotalHistogram = sendTransactionTotalHistogram;
exports.sendProposalHistogram = sendProposalHistogram;
exports.sendTransactionHistogram = sendTransactionHistogram;
exports.errorRequestCounter = errorRequestCounter;