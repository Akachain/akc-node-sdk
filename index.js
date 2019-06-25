const _invoke = require('./app/invoke');
const _query = require('./app/query');

const invoke = async (peerNames, channelName, chaincodeName, fcn, args, username, org_name) => {
  return await _invoke.invokeChaincode(peerNames, channelName, chaincodeName, fcn, args, username, org_name);
}

const query = async (channelName, chaincodeName, args, fcn, org_name) => {
  return await _query.queryChaincode(channelName, chaincodeName, args, fcn, org_name);
}

const getBlockByNumber = async (peer, channelName, blockNumber, username, org_name) => {
  return await _query.getBlockByNumber(peer, channelName, blockNumber, username, org_name);
}

const getTransactionByID = async (peer, channelName, trxnID, username, org_name) => {
  return await _query.getTransactionByID(peer, channelName, trxnID, username, org_name);
}

const getBlockByHash = async (peer, channelName, hash, username, org_name) => {
  return await _query.getBlockByHash(peer, channelName, hash, username, org_name);
}

const getChainInfo = async (peer, channelName, username, org_name) => {
  return await _query.getChainInfo(peer, channelName, username, org_name);
}

const getInstalledChaincodes = async (peer, channelName, type, username, org_name) => {
  return await _query.getInstalledChaincodes(peer, channelName, type, username, org_name);
}

const getChannels = async (peer, username, org_name) => {
  return await _query.getChannels(peer, username, org_name);
}

module.exports = {
  invoke,
  query,
  getBlockByNumber,
  getTransactionByID,
  getBlockByHash,
  getChainInfo,
  getInstalledChaincodes,
  getChannels
};