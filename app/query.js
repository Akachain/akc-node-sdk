/**
 * This is a modified version of source code from IBM
 * Source from https://github.com/hyperledger/fabric-samples/blob/release-1.4/balance-transfer/app/query.js
 */
var util = require('util');
const helper = require('../common/client');
const loggerConfig = require('../common/logger');
const logger = loggerConfig.getLogger('query-chaincode');
const common = require('../common/common');

// QueryChaincode sends a proposal to one or more endorsing peers that will be handled by the chaincode
var queryChaincode = async function (peerNames, channelName, chaincodeName, fcn, args, orgName, userName) {
  try {
    // first setup the client for this or
    const channel = await common.getChannel(orgName, userName, channelName);
    if (!channel) {
      let message = util.format('Channel %s was not defined in the connection profile', channelName);
      logger.error(message);
      throw new Error(message);
    }

    let request = {
      targets: peerNames, //queryByChaincode allows for multiple targets
      chaincodeId: chaincodeName,
      fcn: fcn,
      args: args
    };

    let response_payloads = await channel.queryByChaincode(request);
    if (response_payloads) {
      for (let i = 0; i < response_payloads.length; i++) {
        logger.debug('------->>> R E S P O N S E : ' + response_payloads[i].toString('utf8'));
        return response_payloads[i].toString('utf8');

      }
    } else {
      logger.error('response_payloads is null');
      return 'response_payloads is null';
    }
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};
// Get block's information by blockNumber
var getBlockByNumber = async function (peer, channelName, blockNumber, orgName, userName) {
  try {
    // first setup the client for this org
    var client = await helper.getClientForOrg(orgName, userName);
    logger.debug('Successfully got the fabric client for the organization "%s"', orgName);
    var channel = client.getChannel(channelName);
    if (!channel) {
      let message = util.format('Channel %s was not defined in the connection profile', channelName);
      logger.error(message);
      throw new Error(message);
    }

    let response_payload = await channel.queryBlock(parseInt(blockNumber, peer));
    if (response_payload) {
      logger.debug(response_payload);
      return response_payload;
    } else {
      logger.error('response_payload is null');
      return 'response_payload is null';
    }
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};
// Get transaction's information by trxnID (transaction ID)
var getTransactionByID = async function (peer, channelName, trxnID, orgName, userName) {
  try {
    // first setup the client for this org
    var client = await helper.getClientForOrg(orgName, userName);
    logger.debug('Successfully got the fabric client for the organization "%s"', orgName);
    var channel = client.getChannel(channelName);
    if (!channel) {
      let message = util.format('Channel %s was not defined in the connection profile', channelName);
      logger.error(message);
      throw new Error(message);
    }

    let response_payload = await channel.queryTransaction(trxnID, peer);
    if (response_payload) {
      logger.debug(response_payload);
      return response_payload;
    } else {
      logger.error('response_payload is null');
      return 'response_payload is null';
    }
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};
// Get block's information by blockHash
var getBlockByHash = async function (peer, channelName, hash, orgName, userName) {
  try {
    // first setup the client for this org
    var client = await helper.getClientForOrg(orgName, userName);
    logger.debug('Successfully got the fabric client for the organization "%s"', orgName);
    var channel = client.getChannel(channelName);
    if (!channel) {
      let message = util.format('Channel %s was not defined in the connection profile', channelName);
      logger.error(message);
      throw new Error(message);
    }

    let response_payload = await channel.queryBlockByHash(Buffer.from(hash, 'hex'), peer);
    if (response_payload) {
      logger.debug(response_payload);
      return response_payload;
    } else {
      logger.error('response_payload is null');
      return 'response_payload is null';
    }
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};
// Queries for various useful information on the state of the Channel (height, known peers)
var getChainInfo = async function (peer, channelName, orgName, userName) {
  try {
    // first setup the client for this org
    var client = await helper.getClientForOrg(orgName, userName);
    logger.debug('Successfully got the fabric client for the organization "%s"', orgName);
    var channel = client.getChannel(channelName);
    if (!channel) {
      let message = util.format('Channel %s was not defined in the connection profile', channelName);
      logger.error(message);
      throw new Error(message);
    }

    let response_payload = await channel.queryInfo(peer);
    if (response_payload) {
      logger.debug(response_payload);
      return response_payload;
    } else {
      logger.error('response_payload is null');
      return 'response_payload is null';
    }
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};
// Queries the ledger on the target peer for instantiated chaincodes on this channel
var getInstalledChaincodes = async function (peer, channelName, type, orgName, userName) {
  try {
    // first setup the client for this org
    var client = await helper.getClientForOrg(orgName, userName);
    logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

    let response = null
    if (type === 'installed') {
      response = await client.queryInstalledChaincodes(peer, true); //use the admin identity
    } else {
      var channel = client.getChannel(channelName);
      if (!channel) {
        let message = util.format('Channel %s was not defined in the connection profile', channelName);
        logger.error(message);
        throw new Error(message);
      }
      response = await channel.queryInstantiatedChaincodes(peer, true); //use the admin identity
    }
    if (response) {
      if (type === 'installed') {
        logger.debug('<<< Installed Chaincodes >>>');
      } else {
        logger.debug('<<< Instantiated Chaincodes >>>');
      }
      var details = [];
      for (let i = 0; i < response.chaincodes.length; i++) {
        logger.debug('name: ' + response.chaincodes[i].name + ', version: ' +
          response.chaincodes[i].version + ', path: ' + response.chaincodes[i].path
        );
        details.push('name: ' + response.chaincodes[i].name + ', version: ' +
          response.chaincodes[i].version + ', path: ' + response.chaincodes[i].path
        );
      }
      return details;
    } else {
      logger.error('response is null');
      return 'response is null';
    }
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};
// Queries the target peer for the names of all the channels that a peer has joined
var getChannels = async function (peer, orgName, userName) {
  try {
    // first setup the client for this org
    var client = await helper.getClientForOrg(orgName, userName);
    logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

    let response = await client.queryChannels(peer);
    if (response) {
      logger.debug('<<< channels >>>');
      var channelNames = [];
      for (let i = 0; i < response.channels.length; i++) {
        channelNames.push('channel id: ' + response.channels[i].channel_id);
      }
      logger.debug(channelNames);
      return response;
    } else {
      logger.error('response_payloads is null');
      return 'response_payloads is null';
    }
  } catch (error) {
    logger.error('Failed to query due to error: ' + error.stack ? error.stack : error);
    return error.toString();
  }
};

exports.queryChaincode = queryChaincode;
exports.getBlockByNumber = getBlockByNumber;
exports.getTransactionByID = getTransactionByID;
exports.getBlockByHash = getBlockByHash;
exports.getChainInfo = getChainInfo;
exports.getInstalledChaincodes = getInstalledChaincodes;
exports.getChannels = getChannels;
