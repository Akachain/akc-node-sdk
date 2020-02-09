const _invoke = require('./app/invoke');
const _query = require('./app/query');
const _client = require('./common/client');
const _logger = require('./common/logger');
const _crawlBlock = require('./common/crawlBlock');

/**
 * invoke transaction
 * @param {*} peerNames 
 * @param {*} channelName 
 * @param {*} chaincodeName 
 * @param {*} fcn 
 * @param {*} args 
 * @param {*} userName 
 * @param {*} orgName 
 */
const invoke = async (peerNames, channelName, chaincodeName, fcn, args, orgName, userName) => {
  return await _invoke.invokeChaincode(peerNames, channelName, chaincodeName, fcn, args, orgName, userName);
};

/**
 * Query transaction
 * @param {*} peerNames 
 * @param {*} channelName 
 * @param {*} chaincodeName 
 * @param {*} fcn 
 * @param {*} args 
 * @param {*} orgName 
 * @param {*} userName 
 */
const query = async (peerNames, channelName, chaincodeName, fcn, args, orgName, userName) => {
  return await _query.queryChaincode(peerNames, channelName, chaincodeName, fcn, args, orgName, userName);
};

/**
 * Get block's information by blockNumber
 * @param {*} peer 
 * @param {*} channelName 
 * @param {*} blockNumber 
 * @param {*} orgName 
 * @param {*} userName 
 */
const getBlockByNumber = async (peer, channelName, blockNumber, orgName, userName) => {
  return await _query.getBlockByNumber(peer, channelName, blockNumber, orgName, userName);
};

/**
 * Get transaction's information by trxnID (transaction ID)
 * @param {*} peer 
 * @param {*} channelName 
 * @param {*} trxnID 
 * @param {*} userName 
 * @param {*} orgName 
 */
const getTransactionByID = async (peer, channelName, trxnID, orgName, userName) => {
  return await _query.getTransactionByID(peer, channelName, trxnID, orgName, userName);
};

/**
 * Get block's information by blockHash
 * @param {*} peer 
 * @param {*} channelName 
 * @param {*} hash 
 * @param {*} orgName 
 * @param {*} userName 
 */
const getBlockByHash = async (peer, channelName, hash, orgName, userName) => {
  return await _query.getBlockByHash(peer, channelName, hash, orgName, userName);
};

/**
 * Get block's information by blockHash
 * @param {*} peer 
 * @param {*} channelName 
 * @param {*} userName 
 * @param {*} orgName 
 */
const getChainInfo = async (peer, channelName, orgName, userName) => {
  return await _query.getChainInfo(peer, channelName, orgName, userName);
};

/**
 * Queries the ledger on the target peer for instantiated chaincodes on this channel
 * @param {*} peer 
 * @param {*} channelName 
 * @param {*} type 
 * @param {*} orgName 
 * @param {*} userName 
 */
const getInstalledChaincodes = async (peer, channelName, type, orgName, userName) => {
  return await _query.getInstalledChaincodes(peer, channelName, type, orgName, userName);
};

/**
 * Queries the target peer for the names of all the channels that a peer has joined
 * @param {*} peer 
 * @param {*} userName 
 * @param {*} orgName 
 */
const getChannels = async (peer, orgName, userName) => {
  return await _query.getChannels(peer, orgName, userName);
};

/**
 * Get an instance of client initialized with the network end points
 * @param {*} orgName 
 * @param {*} userName 
 */
const getClientForOrg = async (orgName, userName) => {
  return await _client.getClientForOrg(orgName, userName);
};

/**
 * Register a new user and return the enrollment secret
 * @param {*} userName 
 * @param {*} userOrg 
 * @param {*} isJson 
 */
const registerUser = async (userName, userOrg, isJson) => {
  return await _client.registerUser(userName, userOrg, isJson);
};

/**
 * Set file path of log file
 * @param {*} file_path 
 */
const setFilePath = async (file_path) => {
  return await _logger.setFilePath(file_path);
};

/**
 * Set logger module name
 * @param {*} moduleName 
 */
const getLogger = (moduleName) => {
  return _logger.getLogger(moduleName);
};

/**
 * Get data block
 * @param {*} blockNumberOrHash 
 * @param {*} option 
 */
const crawlBlock = async (blockNumberOrHash, option) => {
  return await _crawlBlock.crawlBlock(blockNumberOrHash, option);
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
  getLogger,
  crawlBlock
};