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

async function getClientForOrg(userorg, username) {
  logger.debug('getClientForOrg - ****** START %s %s', userorg, username);
  const config = '-connection-profile-path';

  const client = hfc.loadFromConfig(hfc.getConfigSetting(`network${config}`));
  client.loadFromConfig(hfc.getConfigSetting(userorg + config));

  await client.initCredentialStores();
  if (username) {
    const user = await client.getUserContext(username, true);
    if (!user) {
      throw new Error(util.format('User was not found :', username));
    } else {
      logger.debug('User %s was found to be registered and enrolled', username);
    }
  }
  logger.debug('getClientForOrg - ****** END %s %s \n\n', userorg, username);

  return client;
}

async function registerUser(username, userOrg, isJson) {
  try {
    const fabricClient = await getClientForOrg(userOrg);
    // client can now act as an agent for organization Org1
    // first check to see if the user is already enrolled
    let user = await fabricClient.getUserContext(username, true);
    if (user && user.isEnrolled()) {
      logger.info('Successfully loaded member from persistence');
    } else {
      // user was not enrolled, so we will need an admin user object to register
      logger.info('User %s was not enrolled, so we will need an admin user object to register', username);
      // var admins = hfc.getConfigSetting('admins');
      const caClient = fabricClient.getCertificateAuthority();
      const admins = caClient.getRegistrar();
      const adminUserObj = await fabricClient.setUserContext({
        username: admins[0].enrollId,
        password: admins[0].enrollSecret,
      });
      const secret = await caClient.register({
        enrollmentID: username,
        affiliation: `${userOrg.toLowerCase()}.department1'`,
      }, adminUserObj);
      logger.info('Successfully got the secret for user %s', username);
      user = await fabricClient.setUserContext({ username, password: secret });
      logger.debug('Successfully enrolled username %s  and setUserContext on the client object', username);
    }
    if (user && user.isEnrolled) {
      if (isJson && isJson === true) {
        const response = {
          success: true,
          message: `${username} enrolled Successfully`,
        };
        return response;
      }
      return `${username} enrolled Successfully`;
    }
    throw new Error('User was not enrolled ');
  } catch (error) {
    logger.error('Failed to get registered user: %s with error: %s', username, error.toString());
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
