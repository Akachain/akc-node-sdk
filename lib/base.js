/*
 * SPDX-License-Identifier: GNU GENERAL PUBLIC LICENSE 2.0
 */

'use strict';

// Import services
const common = require('./utils/common')
const logger = require('./utils/logger')
const InvokeService = require('./helper/InvokeService')
const QueryService = require('./helper/QueryService')
const CAService = require('./helper/CAService')
const ChaincodeService = require('./helper/ChaincodeService')

// Instance services
const invokeService = new InvokeService()
const queryService = new QueryService()
const cAService = new CAService()
const chaincodeService = new ChaincodeService()

// Export SDK's functions
module.exports = {
    registerUser: cAService.registerUser,
    enrollUser: cAService.enrollUser,
    tlsEnroll: cAService.tlsEnroll,
    getClientForOrg: common.getClientForOrg,
    getChannels: common.getChannel,
    invoke: invokeService.invokeChaincode,
    query: queryService.queryChaincode,
    getBlockByNumber: queryService.getBlockByNumber,
    getTransactionByID: queryService.getTransactionByID,
    getBlockByHash: queryService.getBlockByHash,
    getChannelInfo: queryService.getChannelInfo,
    getInstalledChaincodes: queryService.getInstalledChaincodes,
    crawlBlock: queryService.crawlBlock,
    getLogger: logger.getLogger,
    installChaincode: chaincodeService.installChaincode,
    initChaincode: chaincodeService.initChaincode,
    upgradeChaincode: chaincodeService.upgradeChaincode
}