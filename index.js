const _invoke = require('./app/invoke');
const _query = require('./app/query');
const _client = require('./common/client');
const _logger = require('./common/logger');

/**
 * invoke transaction
 * @param {*} peerNames 
 * @param {*} channelName 
 * @param {*} chaincodeName 
 * @param {*} fcn 
 * @param {*} args 
 * @param {*} username 
 * @param {*} org_name 
 */
const invoke = async (peerNames, channelName, chaincodeName, fcn, args, username, org_name) => {
  return await _invoke.invokeChaincode(peerNames, channelName, chaincodeName, fcn, args, username, org_name);
};

/**
 * query transaction
 * @param {*} channelName 
 * @param {*} chaincodeName 
 * @param {*} args 
 * @param {*} fcn 
 * @param {*} org_name 
 */
const query = async (channelName, chaincodeName, args, fcn, org_name) => {
  return await _query.queryChaincode(channelName, chaincodeName, args, fcn, org_name);
};

/**
 * 
 * @param {*} peer 
 * @param {*} channelName 
 * @param {*} blockNumber 
 * @param {*} username 
 * @param {*} org_name 
 */
const getBlockByNumber = async (peer, channelName, blockNumber, username, org_name) => {
  return await _query.getBlockByNumber(peer, channelName, blockNumber, username, org_name);
};

/**
 * 
 * @param {*} peer 
 * @param {*} channelName 
 * @param {*} trxnID 
 * @param {*} username 
 * @param {*} org_name 
 */
const getTransactionByID = async (peer, channelName, trxnID, username, org_name) => {
  return await _query.getTransactionByID(peer, channelName, trxnID, username, org_name);
};

/**
 * 
 * @param {*} peer 
 * @param {*} channelName 
 * @param {*} hash 
 * @param {*} username 
 * @param {*} org_name 
 */
const getBlockByHash = async (peer, channelName, hash, username, org_name) => {
  return await _query.getBlockByHash(peer, channelName, hash, username, org_name);
};

/**
 * 
 * @param {*} peer 
 * @param {*} channelName 
 * @param {*} username 
 * @param {*} org_name 
 */
const getChainInfo = async (peer, channelName, username, org_name) => {
  return await _query.getChainInfo(peer, channelName, username, org_name);
};

/**
 * 
 * @param {*} peer 
 * @param {*} channelName 
 * @param {*} type 
 * @param {*} username 
 * @param {*} org_name 
 */
const getInstalledChaincodes = async (peer, channelName, type, username, org_name) => {
  return await _query.getInstalledChaincodes(peer, channelName, type, username, org_name);
};

/**
 * 
 * @param {*} peer 
 * @param {*} username 
 * @param {*} org_name 
 */
const getChannels = async (peer, username, org_name) => {
  return await _query.getChannels(peer, username, org_name);
};

/**
 * 
 * @param {*} userorg 
 * @param {*} username 
 */
const getClientForOrg = async (userorg, username) => {
  return await _client.getClientForOrg(userorg, username);
};

/**
 * 
 * @param {*} username 
 * @param {*} userOrg 
 * @param {*} isJson 
 */
const registerUser = async (username, userOrg, isJson) => {
  return await _client.registerUser(username, userOrg, isJson);
};

/**
 * set file path of log file
 * @param {*} file_path 
 */
const setFilePath = async (file_path) => {
  return await _logger.setFilePath(file_path);
};

/**
 * set logger module name
 * @param {*} moduleName 
 */
const getLogger = (moduleName) => {
  return _logger.getLogger(moduleName);
};

module.exports = {
  invoke,
  query,
  getBlockByNumber,
  getTransactionByID,
  getBlockByHash,
  getChainInfo,
  getInstalledChaincodes,
  getChannels,
  getClientForOrg,
  registerUser,
  setFilePath,
  getLogger
};