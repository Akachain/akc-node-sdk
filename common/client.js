/**
 * This is a modified version of source code from IBM
 * Source from https://github.com/hyperledger/fabric-samples/blob/release-1.4/balance-transfer/app/helper.js
 */
'use strict';

const hfc = require('fabric-client');
const util = require('util');
const loggerCommon = require('./logger');
const logger = loggerCommon.getLogger('client');
hfc.setLogger(logger);

// Get an instance of client initialized with the network end points
async function getClientForOrg(userorg, userName) {
  logger.debug('getClientForOrg - ****** START %s %s', userorg, userName);
  const config = '-connection-profile-path';

  const client = hfc.loadFromConfig(hfc.getConfigSetting(`network${config}`));
  client.loadFromConfig(hfc.getConfigSetting(userorg + config));

  await client.initCredentialStores();
  if (userName) {
    const user = await client.getUserContext(userName, true);
    if (!user) {
      throw new Error(util.format('User was not found :', userName));
    } else {
      logger.debug('User %s was found to be registered and enrolled', userName);
    }
  }
  logger.debug('getClientForOrg - ****** END %s %s \n\n', userorg, userName);

  return client;
}

// Register a new user and return the enrollment secret
async function registerUser(userName, userOrg, isJson) {
  try {
    const fabricClient = await getClientForOrg(userOrg);
    // client can now act as an agent for organization Org1
    // first check to see if the user is already enrolled
    let user = await fabricClient.getUserContext(userName, true);
    if (user && user.isEnrolled()) {
      logger.info('Successfully loaded member from persistence');
    } else {
      // user was not enrolled, so we will need an admin user object to register
      logger.info('User %s was not enrolled, so we will need an admin user object to register', userName);
      // var admins = hfc.getConfigSetting('admins');
      const caClient = fabricClient.getCertificateAuthority();
      const admins = caClient.getRegistrar();
      const adminUserObj = await fabricClient.setUserContext({
        userName: admins[0].enrollId,
        password: admins[0].enrollSecret,
      });
      const secret = await caClient.register({
        enrollmentID: userName,
        affiliation: `${userOrg.toLowerCase()}.department1'`,
      }, adminUserObj);
      logger.info('Successfully got the secret for user %s', userName);
      user = await fabricClient.setUserContext({ userName, password: secret });
      logger.debug('Successfully enrolled userName %s  and setUserContext on the client object', userName);
    }
    if (user && user.isEnrolled) {
      if (isJson && isJson === true) {
        const response = {
          success: true,
          message: `${userName} enrolled Successfully`,
        };
        return response;
      }
      return `${userName} enrolled Successfully`;
    }
    throw new Error('User was not enrolled ');
  } catch (error) {
    logger.error('Failed to get registered user: %s with error: %s', userName, error.toString());
    return `failed ${error.toString()}`;
  }
}

async function tlsEnroll(client) {
  const caClient = client.getCertificateAuthority();
  const admins = caClient.getRegistrar();
  const req = {
    enrollmentID: admins[0].enrollId,
    enrollmentSecret: admins[0].enrollSecret,
    profile: 'tls',
  };
  const enrollment = await caClient.enroll(req);
  enrollment.key = enrollment.key.toBytes();
  return enrollment;
}

exports.getClientForOrg = getClientForOrg;
exports.registerUser = registerUser;
exports.tlsEnroll = tlsEnroll;
