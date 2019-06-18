const _invoke = require('./app/invoke-transaction');
const _query = require('./app/query');

async function invoke(peerNames, channelName, chaincodeName, fcn, args, username, org_name) {
  return await _invoke.invokeChaincode(peerNames, channelName, chaincodeName, fcn, args, username, org_name);
}

async function query(peer, channelName, chaincodeName, args, fcn, username, org_name) {
  return await _query.queryChaincode(peer, channelName, chaincodeName, args, fcn, username, org_name);
}

module.exports = { invoke, query }