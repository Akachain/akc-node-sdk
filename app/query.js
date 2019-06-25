/**
 * This is a modified version of source code from IBM
 * Source from https://github.com/hyperledger/fabric-samples/blob/release-1.4/balance-transfer/app/query.js
 */
var util = require('util');
var helper = require('./helper.js');
var logger = helper.getLogger('Query');
var fabricClient = require('fabric-client');

// queryChaincode modified
var queryChaincode = async function (channelName, chaincodeName, args, fcn, org_name) {
	const client = await fabricClient.getClientForOrg(org_name, org_name);
	const channel = client.getChannel(channelName);
	if (!channel) {
		const message = util.format('Channel %s was not defined in the connection profile', channelName);
		logger.error(message);
		throw new Error(message);
	}

	const targets = client.getPeersForOrg();
	const txId = client.newTransactionID();
	logger.debug(util.format('Sending transaction "%j"', txId));

	// send proposal to endorser
	const request = {
		targets,
		chaincodeName,
		fcn,
		args,
		txId,
		chainId: channelName,
	};
	const resultQuery = await queryLib.Query(request, channel);
	logger.debug('chaincode response => typeof resultQuery:', typeof resultQuery, '; value: ', resultQuery);
	return resultQuery;
};
var getBlockByNumber = async function (peer, channelName, blockNumber, username, org_name) {
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
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
var getTransactionByID = async function (peer, channelName, trxnID, username, org_name) {
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
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
var getBlockByHash = async function (peer, channelName, hash, username, org_name) {
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
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
var getChainInfo = async function (peer, channelName, username, org_name) {
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);
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
//getInstalledChaincodes
var getInstalledChaincodes = async function (peer, channelName, type, username, org_name) {
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);

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
var getChannels = async function (peer, username, org_name) {
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(org_name, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', org_name);

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
