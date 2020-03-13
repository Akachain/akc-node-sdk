/*
 * SPDX-License-Identifier: GNU GENERAL PUBLIC LICENSE 2.0
 */

'use strict';

// Import lib
const util = require('util');

const logger = require('../utils/logger').getLogger('ca-service')
const common = require('../utils/common')
const CAService = require('../helper/CAService')

const caService = new CAService()

class ChaincodeService {
    constructor() {}

    async installChaincode(orgName, {
        chaincodePath,
        chaincodeId,
        metadataPath,
        chaincodeVersion,
        chaincodeType
    }) {
        let errorMessage = null;
        try {
            const client = await common.getClientForOrg(orgName, null, true);
            const peers = client.getPeersForOrg();
            logger.debug(`'Successfully got the fabric client for the organization ${orgName}`);

            // Enable client TLS
            const tlsInfo = await caService.tlsEnroll(client)
            client.setTlsClientCertAndKey(tlsInfo.certificate, tlsInfo.key);

            const request = {
                targets: peers,
                chaincodePath,
                chaincodeId,
                metadataPath,
                chaincodeVersion,
                chaincodeType,
            };
            const results = await client.installChaincode(request);
            const proposalResponses = results[0];
            let allGood = true;
            const errorProposal = [];
            for (const i in proposalResponses) {
                let oneGood = false;
                if (proposalResponses && proposalResponses[i].response &&
                    proposalResponses[i].response.status === 200) {
                    oneGood = true;
                    logger.debug('instantiate proposal was good');
                } else {
                    logger.error('instantiate proposal was bad');
                    errorProposal.push(`proposalResponses [${i}]: ${proposalResponses[i].message}`);
                }
                allGood = allGood & oneGood;
            }
            if (allGood) {
                const response = {
                    success: true,
                    message: 'Successfully sent install Proposal and received ProposalResponse',
                };
                logger.debug('Successfully sent install Proposal and received ProposalResponse');
                return response;
            } else {
                errorMessage = `Failed to send Proposal and receive all good ProposalResponse. ${errorProposal}`;
                logger.error(errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error) {
            logger.error(`Failed to install due to error: ${error.stack ? error.stack : error}`);
            errorMessage = error.toString();
            throw new Error(errorMessage);
        }
    }

    async initChaincode(orgName, channelName, {
        chaincodeId,
        chaincodeVersion,
        chaincodeType,
        args,
        endorsementPolicy
    }) {
        logger.debug(`\n\n============ Instantiate chaincode on channel ${channelName} ============\n`);
        let errorMessage = null;
        try {
            const client = await common.getClientForOrg(orgName);
            logger.debug('Successfully got the fabric client for the organization "%s"', orgName);
            // enable Client TLS
            const tlsInfo = await caService.tlsEnroll(client);
            client.setTlsClientCertAndKey(tlsInfo.certificate, tlsInfo.key);
            const peers = client.getPeersForOrg();
            const channel = await common.getChannel(orgName, channelName, true);
            if (!channel) {
                const message = `Channel ${channelName} was not defined in the connection profile`;
                logger.error(message);
                throw new Error(message);
            }
            const txId = client.newTransactionID(true); // Get an admin based transactionID
            // An admin based transactionID will
            // indicate that admin identity should
            // be used to sign the proposal request.
            // will need the transaction ID string for the event registration later
            const deployId = txId.getTransactionID();
            if (endorsementPolicy === '' || !endorsementPolicy) {
                endorsementPolicy = await common.getDefaultEndorsermentPolicy(channel);
            }
            logger.debug('Default Endorsement Policy: ', JSON.stringify(endorsementPolicy));

            // send proposal to endorser
            const request = {
                targets: peers,
                chaincodeId,
                chaincodeVersion,
                chaincodeType,
                args,
                txId,
                'endorsement-policy': endorsementPolicy,
            };

            const results = await channel.sendInstantiateProposal(request, 160000);
            // instantiate takes much longer

            // the returned object has both the endorsement results
            // and the actual proposal, the proposal will be needed
            // later when we send a transaction to the orderer
            const proposalResponses = results[0];
            const proposal = results[1];
            logger.debug('>> proposalResponses: ', proposalResponses);

            // lets have a look at the responses to see if they are
            // all good, if good they will also include signatures
            // required to be committed
            let allGood = true;
            const errorProposal = [];
            for (const i in proposalResponses) {
                let oneGood = false;
                if (proposalResponses && proposalResponses[i].response &&
                    proposalResponses[i].response.status === 200) {
                    oneGood = true;
                    logger.debug('instantiate proposal was good');
                } else {
                    logger.error('instantiate proposal was bad');
                    errorProposal.push(`proposalResponses [${i}]: ${proposalResponses[i].message}`);
                }
                allGood = allGood & oneGood;
            }
            if (allGood) {
                logger.debug('Successfully sent Proposal and received ProposalResponse');
                logger.debug(util.format(
                    'Status - %s, message - %s, metadata - %s, endorsement signature: %s',
                    proposalResponses[0].response.status, proposalResponses[0].response.message,
                    proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature,
                ));

                // wait for the channel-based event hub to tell us that the
                // instantiate transaction was committed on the peer
                const promises = [];
                const eventHubs = channel.getChannelEventHubsForOrg();
                logger.debug('found %s eventhubs for this organization %s', eventHubs.length, orgName);
                eventHubs.forEach((eh) => {
                    const instantiateEventPromise = new Promise((resolve, reject) => {
                        logger.debug('instantiateEventPromise - setting up event');
                        const eventTimeout = setTimeout(() => {
                            const message = `REQUEST_TIMEOUT: ${eh.getPeerAddr()}`;
                            logger.error(message);
                            eh.disconnect();
                            // reject(new Error(message));
                        }, 30000);
                        eh.registerTxEvent(deployId, (tx, code, blockNum) => {
                                logger.debug('The chaincode instantiate transaction has been committed on peer %s', eh.getPeerAddr());
                                logger.debug('Transaction %s has status of %s in block %s', tx, code, blockNum);
                                clearTimeout(eventTimeout);

                                if (code !== 'VALID') {
                                    const message = util.format('The chaincode instantiate transaction was invalid, code:%s', code);
                                    logger.error(message);
                                    reject(new Error(message));
                                } else {
                                    const message = 'The chaincode instantiate transaction was valid.';
                                    logger.debug(message);
                                    resolve(message);
                                }
                            }, (err) => {
                                clearTimeout(eventTimeout);
                                logger.error(err);
                                reject(err);
                            },
                            // the default for 'unregister' is true for transaction listeners
                            // so no real need to set here, however for 'disconnect'
                            // the default is false as most event hubs are long running
                            // in this use case we are using it only once
                            {
                                unregister: true,
                                disconnect: false,
                            });
                        eh.connect();
                    });
                    promises.push(instantiateEventPromise);
                });

                const ordererRequest = {
                    txId, // must include the transaction id so that the outbound
                    // transaction to the orderer will be signed by the admin
                    // id as was the proposal above, notice that transactionID
                    // generated above was based on the admin id not the current
                    // user assigned to the 'client' instance.
                    proposalResponses,
                    proposal,
                };
                const sendPromise = channel.sendTransaction(ordererRequest);
                // put the send to the orderer last so that the events get registered and
                // are ready for the orderering and committing
                promises.push(sendPromise);
                const resultPromises = await Promise.all(promises);
                logger.debug(util.format('------->>> R E S P O N S E : %j', resultPromises));
                const response = resultPromises.pop(); //  orderer results are last in the results
                logger.debug('response: ', response);
                if (response.status === 'SUCCESS') {
                    logger.debug('Successfully sent transaction to the orderer.');
                } else {
                    errorMessage = util.format('Init - Failed to order the transaction. Error code: %s', response.status);
                    logger.debug(errorMessage);
                }

                // now see what each of the event hubs reported
                for (const i in resultPromises) {
                    const eventhubResult = resultPromises[i];
                    logger.debug('eventhubResult: ', eventhubResult);
                    const eventHub = eventHubs[i];
                    logger.debug('Event results for event hub :%s', eventHub.getPeerAddr());
                    if (typeof eventhubResult === 'string') {
                        logger.debug(eventhubResult);
                    } else {
                        if (!errorMessage) errorMessage = eventhubResult.toString();
                        logger.debug(eventhubResult.toString());
                    }
                }
            } else {
                errorMessage = `Failed to send Proposal and receive all good ProposalResponse. ${errorProposal}`;
                logger.debug(errorMessage);
            }
        } catch (error) {
            logger.error(`Failed to send instantiate due to error: ${error.stack ? error.stack : error}`);
            errorMessage = error.toString();
        }
        if (!errorMessage) {
            const message = `Successfully instantiate chaincode in organization ${orgName} to the channel ${channelName}`;
            logger.debug(message);
            // build a response to send back to the REST caller
            const response = {
                success: true,
                message
            };
            return response;
        }
        const message = `Failed to instantiate. cause: ${errorMessage}`;
        logger.error(message);
        throw new Error(message);
    }

    async upgradeChaincode(orgName, channelName, {
        chaincodeId,
        chaincodeVersion,
        chaincodeType,
        args,
        endorsementPolicy
    }) {
        logger.debug(`\n\n============ Upgrade chaincode on channel ${channelName} ============\n`);
        let errorMessage = null;
        try {
            const client = await common.getClientForOrg(orgName);
            logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

            const peers = client.getPeersForOrg();

            const channel = client.getChannel(channelName);
            if (!channel) {
                const message = util.format('Channel %s was not defined in the connection profile', channelName);
                logger.error(message);
                throw new Error(message);
            }

            const txId = client.newTransactionID(true); // Get an admin based transactionID
            // An admin based transactionID will
            // indicate that admin identity should
            // be used to sign the proposal request.
            // will need the transaction ID string for the event registration later
            const deployId = txId.getTransactionID();
            if (endorsementPolicy === '' || !endorsementPolicy) {
                endorsementPolicy = await common.getDefaultEndorsermentPolicy(channel);
            }
            logger.debug('Default Endorsement Policy: ', JSON.stringify(endorsementPolicy));

            // send proposal to endorser
            const request = {
                targets: peers,
                chaincodeId,
                chaincodeVersion,
                chaincodeType,
                args,
                txId,
                'endorsement-policy': endorsementPolicy,
            };

            const sendProposalHistogramTimer = common.sendProposalHistogram.startTimer();

            const results = await channel.sendUpgradeProposal(request, 160000);

            // the returned object has both the endorsement results
            // and the actual proposal, the proposal will be needed
            // later when we send a transaction to the orderer
            const proposalResponses = results[0];
            const proposal = results[1];
            logger.debug('>> proposalResponses: ', proposalResponses);

            sendProposalHistogramTimer({
                channel: channelName,
                chaincode: chaincodeId,
            });
            // lets have a look at the responses to see if they are
            // all good, if good they will also include signatures
            // required to be committed
            let allGood = true;
            const errorProposal = [];
            for (const i in proposalResponses) {
                let oneGood = false;
                if (proposalResponses && proposalResponses[i].response &&
                    proposalResponses[i].response.status === 200) {
                    oneGood = true;
                    logger.debug('upgrade proposal was good');
                } else {
                    logger.error('upgrade proposal was bad');
                    errorProposal.push(`proposalResponses [${i}]: ${proposalResponses[i].message}`);
                }
                allGood = allGood & oneGood;
            }

            if (allGood) {
                logger.debug(util.format(
                    'Successfully sent Proposal and received ProposalResponse: Status - %s, message - %s, metadata - %s, endorsement signature: %s',
                    proposalResponses[0].response.status, proposalResponses[0].response.message,
                    proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature,
                ));

                // wait for the channel-based event hub to tell us that the
                // instantiate transaction was committed on the peer
                const promises = [];
                const eventHubs = channel.getChannelEventHubsForOrg();
                logger.debug('found %s eventhubs for this organization %s', eventHubs.length, orgName);
                eventHubs.forEach((eh) => {
                    const instantiateEventPromise = new Promise((resolve, reject) => {
                        logger.debug('instantiateEventPromise - setting up event');
                        const eventTimeout = setTimeout(() => {
                            const message = `REQUEST_TIMEOUT: ${eh.getPeerAddr()}`;
                            logger.error(message);
                            eh.disconnect();
                            // reject(new Error(message));
                        }, 60000);
                        eh.registerTxEvent(deployId, (tx, code, blockNum) => {
                                logger.debug('The chaincode upgrade transaction has been committed on peer %s', eh.getPeerAddr());
                                logger.debug('Transaction %s has status of %s in blocl %s', tx, code, blockNum);
                                clearTimeout(eventTimeout);

                                if (code !== 'VALID') {
                                    const message = util.format('The chaincode upgrade transaction was invalid, code:%s', code);
                                    logger.error(message);
                                    reject(new Error(message));
                                } else {
                                    const message = 'The chaincode upgrade transaction was valid.';
                                    logger.debug(message);
                                    resolve(message);
                                }
                            }, (err) => {
                                clearTimeout(eventTimeout);
                                logger.error(err);
                                reject(err);
                            },
                            // the default for 'unregister' is true for transaction listeners
                            // so no real need to set here, however for 'disconnect'
                            // the default is false as most event hubs are long running
                            // in this use case we are using it only once
                            {
                                unregister: true,
                                disconnect: false,
                            });
                        eh.connect();
                    });
                    promises.push(instantiateEventPromise);
                });

                const ordererRequest = {
                    txId, // must include the transaction id so that the outbound
                    // transaction to the orderer will be signed by the admin
                    // id as was the proposal above, notice that transactionID
                    // generated above was based on the admin id not the current
                    // user assigned to the 'client' instance.
                    proposalResponses,
                    proposal,
                };
                const sendTransactionTimer = common.sendTransactionHistogram.startTimer();

                const sendPromise = channel.sendTransaction(ordererRequest);
                // put the send to the orderer last so that the events get registered and
                // are ready for the orderering and committing
                promises.push(sendPromise);
                // end timer
                sendTransactionTimer({
                    channel: channelName,
                    chaincode: chaincodeId,
                });

                const resultPromises = await Promise.all(promises);
                logger.debug(util.format('------->>> R E S P O N S E : %j', resultPromises));
                const response = resultPromises.pop(); //  orderer results are last in the results
                if (response.status === 'SUCCESS') {
                    logger.debug('Successfully sent transaction to the orderer.');
                } else {
                    errorMessage = util.format('Upgrade - Failed to order the transaction. Error code: %s', response.status);
                    logger.debug(errorMessage);
                }

                // now see what each of the event hubs reported
                for (const i in resultPromises) {
                    const eventhubResult = resultPromises[i];
                    logger.debug('eventhubResult: ', eventhubResult);
                    const eventHub = eventHubs[i];
                    logger.debug('Event results for event hub :%s', eventHub.getPeerAddr());
                    if (typeof eventhubResult === 'string') {
                        logger.debug(eventhubResult);
                    } else {
                        if (!errorMessage) errorMessage = eventhubResult.toString();
                        logger.debug(eventhubResult.toString());
                    }
                }
            } else {
                errorMessage = `Failed to send Proposal and receive all good ProposalResponse. ${errorProposal}`;
                logger.debug(errorMessage);
            }
        } catch (error) {
            logger.error(`Failed to send upgrade due to error: ${error.stack ? error.stack : error}`);
            errorMessage = error.toString();
        }
        if (errorMessage) {
            const message = util.format(`Failed to upgrade. cause: ${errorMessage}`);
            logger.error(message);
            throw new Error(message);
        }
        const message = `Successfully upgrade chaincode in organization ${orgName} to the channel ${channelName}`;
        logger.debug(message);
        // build a response to send back to the REST caller
        const response = {
            message,
            success: true,
        };
        return response;
    }

}

module.exports = ChaincodeService