/**
 * This is a modified version of source code from IBM
 * Source from https://github.com/hyperledger/fabric-samples/blob/release-1.4/balance-transfer/app/invoke-transaction.js
 */
'use strict';
const util = require('util');
const helper = require('../common/client');
const loggerConfig = require('../common/logger');
const logger = loggerConfig.getLogger('invoke-chaincode');
const promClient = require('prom-client');
const common = require('../common/common');

const sendTransactionTotalHistogram = new promClient.Histogram({
  name: 'akc_send_transaction_total_duration',
  help: 'Histogram of send transaction total duration',
  labelNames: ['channel', 'chaincode', 'function']
});

const sendProposalHistogram = new promClient.Histogram({
  name: 'akc_send_proposal_duration',
  help: 'Histogram of send proposal duration',
  labelNames: ['channel', 'chaincode', 'function']
});

const sendTransactionHistogram = new promClient.Histogram({
  name: 'akc_send_transaction_duration',
  help: 'Histogram of send transaction duration',
  labelNames: ['channel', 'chaincode', 'function']
});

const invokeChaincode = async function (peerNames, channelName, chaincodeName, fcn, args, username, org_name) {
  var getClientStart = process.hrtime();

  // start timer send transaction total
  const sendTransactionTotalHistogramTimer = sendTransactionTotalHistogram.startTimer();

  console.log(peerNames, channelName, chaincodeName, fcn, args, username, org_name);
  logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));
  let error_message = null;
  let tx_id_string = null;
  let client = null;
  let channel = null;
  try {
    // first setup the client for this org
    client = await common.getClient(org_name, username)
    logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
    channel = await common.getChannel(org_name, username, channelName);
    if (!channel) {
      let message = util.format('Channel %s was not defined in the connection profile', channelName);
      logger.error(message);
      throw new Error(message);
    }
    const tx_id = client.newTransactionID();
    // will need the transaction ID string for the event registration later
    tx_id_string = tx_id.getTransactionID();

    // we want to choose the endorsing peer in sequence 
    let round = 0;

    // send proposal to endorser
    const request = {
      targets: peerNames,
      chaincodeId: chaincodeName,
      fcn: fcn,
      args: args,
      chainId: channelName,
      txId: tx_id
    };

    // start timer send transaction
    const sendProposalHistogramTimer = sendProposalHistogram.startTimer();

    var getClientEnd = process.hrtime(getClientStart)
    logger.info('Setup client time (hr): %ds %dms', getClientEnd[0], getClientEnd[1] / 1000000)

    var hrstart = process.hrtime() 
    var results = await channel.sendTransactionProposal(request);
    var hrend = process.hrtime(hrstart)
    logger.info('Send proposal time to %s (hr): %ds %dms', results[0][0].peer.name, hrend[0], hrend[1] / 1000000)

    // end timer
    sendProposalHistogramTimer({
      channel: channelName,
      chaincode: chaincodeName,
      function: fcn
    });

    var checkProposalStart = process.hrtime() 

    // the returned object has both the endorsement results
    // and the actual proposal, the proposal will be needed
    // later when we send a transaction to the orderer
    const proposalResponses = results[0];
    const proposal = results[1];

    // look at the responses to see if they are all are good
    // response will also include signatures required to be committed
    let all_good = true;
    var errResponses = [];
    for (const i in proposalResponses) {
      if (proposalResponses[i] instanceof Error) {
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
      } else {
        all_good = false;
        error_message = util.format('invoke chaincode proposal failed for an unknown reason %j', proposalResponses[i]);
        logger.error(error_message);
      }
    }

    if (all_good) {
      logger.info(util.format(
        'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
        proposalResponses[0].response.status, proposalResponses[0].response.message,
        proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));

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
            logger.info('The chaincode invoke chaincode transaction has been committed on peer %s', eh.getPeerAddr());
            logger.info('Transaction %s has status of %s in blocl %s', tx, code, block_num);
            clearTimeout(event_timeout);

            if (code !== 'VALID') {
              let message = util.format('The invoke chaincode transaction was invalid, code:%s', code);
              logger.error(message);
              reject(new Error(message));
            } else {
              let message = 'The invoke chaincode transaction was valid.';
              logger.info(message);
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

      var checkProposalEnd = process.hrtime(checkProposalStart);
      logger.info('Check proposal time: %ds %dms', checkProposalEnd[0], checkProposalEnd[1] / 1000000);

      // start timer send transaction
      var txstart = process.hrtime();
      const sendTransactionTimer = sendTransactionHistogram.startTimer();
      var resultsPromise = await Promise.all(promises);
      var txend = process.hrtime(txstart);
      logger.info('Send tx time (hr): %ds %dms', txend[0], txend[1] / 1000000);

      // end timer
      sendTransactionTimer({
        channel: channelName,
        chaincode: chaincodeName,
        function: fcn
      });

      logger.debug(util.format('------->>> R E S P O N S E : %j', resultsPromise));
      let response = resultsPromise.pop(); //  orderer results are last in the results
      if (response.status === 'SUCCESS') {
        logger.info('Successfully sent transaction to the orderer.');
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
      channel.close();
    }
  }
  let success = true;
  let message = util.format(
    'Successfully invoked the chaincode %s to the channel \'%s\' for transaction ID: %s',
    org_name, channelName, tx_id_string);
  if (error_message) {
    message = util.format('Failed to invoke chaincode. cause:%s', error_message);
    success = false;
    logger.error(message);
    if (errResponses.length > 0) {
      return {
        Result: {
          Status: errResponses[0].status,
          Payload: ""
        },
        Message: errResponses[0].msg,
        MessageDetail: errResponses,
      };
    } else {
      return {
        Result: {
          Status: 202,
          Payload: ""
        },
        Message: errResponses,
        MessageDetail: errResponses,
      };
    }
  } else {
    logger.info(message);
  }

  // build a response to send back to the REST caller
  logger.debug("RESPONSE DATA: ", results[0][0].response.toString())
  var obj = results[0][0].response
  try {
    obj.payload = JSON.parse(obj.payload.toString('utf8'));
  } catch(e) {
    obj.payload = obj.payload.toString('utf8');
  }
  let result = {
    Result: {
      Status: obj.status,
      Payload: obj.payload
    },
    Message: "Success",
    MessageDetail: "Success"
  };

  // send transaction total timer
  sendTransactionTotalHistogramTimer({
    channel: channelName,
    chaincode: chaincodeName,
    function: fcn
  });

  return result;


};

exports.invokeChaincode = invokeChaincode;