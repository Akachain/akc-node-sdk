/*
 * SPDX-License-Identifier: GNU GENERAL PUBLIC LICENSE 2.0
 */

'use strict';

// Import lib
const util = require('util');

const logger = require('../utils/logger').getLogger('invoke-service')
const common = require('../utils/common')

/**
 * InvokeService class provide 'invokeChaincode' function to request a invoked-transaction.
 * It also integrates with 'prom-client' to measure duration metrics when sending the request.
 */
class InvokeService {
    constructor() { }

    /**
     * invokeChaincode sends a proposal to one or more endorsing peers that will be handled by the chaincode
     * @param {string} peerNames 
     * @param {string} channelName 
     * @param {string} chaincodeName 
     * @param {string} fcn 
     * @param {string} args 
     * @param {string} orgName 
     * @param {string} userName 
     */
    async invokeChaincode(peerNames, channelName, chaincodeName, fcn, args, orgName, userName) {
        // increase req counter
        common.requestCounter.inc();

        // start timer send transaction total
        let sendTransactionTotalHistogramTimer = common.sendTransactionTotalHistogram.startTimer();

        logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));
        let error_message = null;
        let tx_id_string = null;
        let client = null;
        let channel = null;
        let all_good = true;
        var errResponses = [];
        try {
            // first setup the client for this org
            client = await common.getClientForOrg(orgName, userName)

            channel = await common.getChannel(orgName, userName, channelName);

            if (!channel) {
                let message = util.format('Channel %s was not defined in the connection profile', channelName);
                logger.error(message);
                throw new Error(message);
            }

            const tx_id = client.newTransactionID();
            // will need the transaction ID string for the event registration later
            tx_id_string = tx_id.getTransactionID();

            // we want to choose the endorsing peer in sequence 
            // let round = 0;

            // send proposal to endorser
            let request = {
                targets: peerNames,
                chaincodeId: chaincodeName,
                fcn: fcn,
                args: args,
                chainId: channelName,
                txId: tx_id
            };

            // start timer send transaction
            let sendProposalHistogramTimer = common.sendProposalHistogram.startTimer();

            var results = await channel.sendTransactionProposal(request);

            // end send proposal timer
            sendProposalHistogramTimer({
                channel: channelName,
                chaincode: chaincodeName,
                function: fcn
            });

            // the returned object has both the endorsement results
            // and the actual proposal, the proposal will be needed
            // later when we send a transaction to the orderer
            const proposalResponses = results[0];
            const proposal = results[1];

            // look at the responses to see if they are all are good
            // response will also include signatures required to be committed
            for (const i in proposalResponses) {
                if (proposalResponses[i] instanceof Error) {
                    // increase counter
                    common.errorRequestCounter.inc();

                    all_good = false;
                    error_message = util.format('invoke chaincode proposal resulted in an error :: %s', proposalResponses[i].toString());
                    logger.error(error_message);
                    let err = proposalResponses[i];
                    logger.debug('invoke chaincode Error Response' + err);
                    let jsonErr = JSON.stringify(err, Object.getOwnPropertyNames(err));
                    let objErr = JSON.parse(jsonErr);
                    try {
                        let convertObj = JSON.parse(objErr.message);
                        let errResponse = {
                            status: convertObj.status,
                            msg: convertObj.msg,
                        };
                        errResponses.push(errResponse);
                        logger.error('error: ', convertObj);
                    } catch (err) {
                        logger.error('error: ', objErr);
                        logger.error('error: ', err);
                    }

                } else if (proposalResponses[i].response && proposalResponses[i].response.status === 200) {
                    logger.info('invoke chaincode proposal was good');
                    logger.debug(util.format(
                        'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
                        proposalResponses[i].response.status, proposalResponses[i].response.message,
                        proposalResponses[i].response.payload, proposalResponses[i].endorsement.signature));
                    logger.info("Endored by:", proposalResponses[i].peer.name);
                } else {
                    // increase counter
                    common.errorRequestCounter.inc();

                    all_good = false;
                    error_message = util.format('invoke chaincode proposal failed for an unknown reason %j', proposalResponses[i]);
                    logger.error(error_message);
                }
            }

            if (all_good) {
                // Check write sets
                if (channel.compareProposalResponseResults(proposalResponses)) {
                    logger.info('All proposals compare equally!');
                } else {
                    logger.warn('All proposals compare differently!')
                }

                // wait for the channel-based event hub to tell us
                // that the commit was good or bad on each peer in our organization
                const promises = [];
                let event_hubs = channel.getChannelEventHubsForOrg();
                event_hubs.forEach((eh) => {
                    logger.debug('invokeEventPromise - setting up event');
                    let invokeEventPromise = new Promise((resolve, reject) => {
                        let event_timeout = setTimeout(() => {
                            let message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
                            logger.error(message);
                            eh.disconnect();
                        }, 30000);
                        eh.registerTxEvent(tx_id_string, (tx, code, block_num) => {
                            logger.debug('The chaincode invoke chaincode transaction has been committed on peer %s', eh.getPeerAddr());
                            logger.debug('Transaction %s has status of %s in blocl %s', tx, code, block_num);
                            clearTimeout(event_timeout);

                            if (code !== 'VALID') {
                                let message = util.format('The invoke chaincode transaction was invalid, code:%s', code);
                                logger.error(message);
                                reject(new Error(message));
                            } else {
                                let message = 'The invoke chaincode transaction was valid.';
                                logger.debug(message);
                                resolve(message);
                            }
                        }, (err) => {
                            clearTimeout(event_timeout);
                            logger.error(err);
                            reject(err);
                        },
                            // the default for 'unregister' is true for transaction listeners
                            // so no real need to set here, however for 'disconnect'
                            // the default is false as most event hubs are long running
                            // in this use case we are using it only once
                            {
                                unregister: true,
                                disconnect: false
                            }
                        );
                        eh.connect();
                    });
                    promises.push(invokeEventPromise);
                });

                const orderer_request = {
                    txId: tx_id,
                    proposalResponses: proposalResponses,
                    proposal: proposal
                };

                const sendPromise = channel.sendTransaction(orderer_request);
                // put the send to the orderer last so that the events get registered and
                // are ready for the orderering and committing
                promises.push(sendPromise);


                // start timer send transaction
                const sendTransactionTimer = common.sendTransactionHistogram.startTimer();
                var resultsPromise = await Promise.all(promises);

                // end timer
                sendTransactionTimer({
                    channel: channelName,
                    chaincode: chaincodeName,
                    function: fcn
                });

                logger.debug(util.format('------->>> R E S P O N S E : %j', resultsPromise));
                let response = resultsPromise.pop(); //  orderer results are last in the results
                if (response.status === 'SUCCESS') {
                    logger.debug('Successfully sent transaction to the orderer.');
                } else {
                    error_message = util.format('Failed to order the transaction. Error code: %s', response.status);
                    logger.debug(error_message);
                }

                // now see what each of the event hubs reported
                for (let i in resultsPromise) {
                    let event_hub_result = resultsPromise[i];
                    let event_hub = event_hubs[i];
                    logger.debug('Event results for event hub :%s', event_hub.getPeerAddr());
                    if (typeof event_hub_result === 'string') {
                        logger.debug(event_hub_result);
                    } else {
                        if (!error_message) error_message = event_hub_result.toString();
                        logger.debug(event_hub_result.toString());
                    }
                }
            }
        } catch (error) {
            logger.error('Failed to invoke due to error: ' + error.stack ? error.stack : error);
            error_message = error.toString();
        } finally {
            if (channel) {
                // We don't close channel here 
                // TODO: add case where channel fail
                // channel.close();
            }
        }
        let success = true;
        let message = util.format(
            'Successfully invoked the chaincode %s to the channel \'%s\' for transaction ID: %s',
            orgName, channelName, tx_id_string);
        if (error_message) {
            message = util.format('Failed to invoke chaincode. cause:%s', error_message);
            success = false;
            logger.error(message);
            if (errResponses.length > 0) {
                // return {
                //     Result: {
                //         Status: errResponses[0].status,
                //         Payload: ""
                //     },
                //     Message: errResponses[0].msg,
                //     MessageDetail: errResponses,
                // };
                return common.createReturn(errResponses[0].status, "", errResponses[0].msg, errResponses);
            } else {
                // return {
                //     Result: {
                //         Status: 202,
                //         Payload: ""
                //     },
                //     Message: error_message,
                //     MessageDetail: error_message,
                // };
                return common.createReturn(202, "", error_message, error_message);
            }
        } else {
            logger.debug(message);
        }

        // build a response to send back to the REST caller
        logger.debug("RESPONSE DATA: ", results[0][0].response)
        var obj = results[0][0].response
        try {
            obj.payload = JSON.parse(obj.payload.toString('utf8'));
        } catch (e) {
            obj.payload = obj.payload.toString('utf8');
        }
        // let result = {
        //     Result: {
        //         Status: obj.status,
        //         Payload: obj.payload
        //     },
        //     Message: "Success",
        //     MessageDetail: "Success"
        // };
        let result = common.createReturn(obj.status, obj.payload, "Success", "Success");

        // send transaction total timer
        sendTransactionTotalHistogramTimer({
            channel: channelName,
            chaincode: chaincodeName,
            function: fcn
        });

        return result;
    }
}

module.exports = InvokeService;