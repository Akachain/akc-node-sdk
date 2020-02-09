/*
 * SPDX-License-Identifier: GNU GENERAL PUBLIC LICENSE 2.0
 */

'use strict';

// Import lib
const util = require('util');

const logger = require('../utils/logger').getLogger('ca-service')
const common = require('../utils/common')

/**
 * CAService class provide functions to register, enroll users for a Organiztion.
 */
class CAService {
    constructor() {}

    /**
     * registerUser
     * @param {JSON} user 
     */
    async registerUser(user) {
        try {
            let message = ''
            const client = await common.getClientForOrg(user.orgName)
            // Client can now act as an agent for organization ${user.orgName}

            // First check to see if the user is already enrolled
            let checkUser = await client.getUserContext(user.userName, true);
            if (checkUser && checkUser.isEnrolled()) {
                logger.debug('Successfully loaded member from persistence');
                message = `Successfully loaded ${user.userName} from persistence.`
                return {
                    success: true,
                    message: message
                };
            } else {
                // user was not enrolled, so we will need an admin user object to register
                logger.debug('User %s was not enrolled, so we will need an admin user object to register', user.userName);
                // var admins = hfc.getConfigSetting('admins');
                const caClient = client.getCertificateAuthority();
                const admins = caClient.getRegistrar();
                const adminUserObj = await client.setUserContext({
                    username: admins[0].enrollId,
                    password: admins[0].enrollSecret,
                });

                // Dialing ca.Register
                user.enrollmentSecret = await caClient.register({
                    enrollmentID: user.userName,
                    enrollmentSecret: user.enrollmentSecret || `${user.userName}pw`,
                    role: user.role || 'client',
                    affiliation: user.affiliation || `${user.orgName.toLowerCase()}.akc`,
                    maxEnrollments: user.maxEnrollments || 1,
                    attrs: user.attrs
                }, adminUserObj);
                logger.debug('Successfully got the secret for user %s', user.userName);
                message = `Registered ${user.userName} successfully. `

                // Enroll user
                let enrollResponse = await this.enrollUser(user)
                if (enrollResponse && enrollResponse.success) {
                    message += `Enrolled ${user.userName} successfully.`
                    return {
                        success: true,
                        message: message
                    };
                } else {
                    message += `Enrolled ${user.userName} failed.`
                    return {
                        success: false,
                        message: message
                    };
                }
            }
        } catch (error) {
            logger.error('Failed to get registered user: %s with error: %s', user.userName, error.toString());
            throw new Error(`Failed to get registered user: ${user.userName} with error: ${error.toString()}`);
        }
    }

    /**
     * enrollUser
     * @param {JSON} user 
     */
    async enrollUser(user) {
        try {
            const client = await common.getClientForOrg(user.orgName);
            // client can now act as an agent for organization ${user.orgName}

            // first check to see if the user is already enrolled
            let checkUser = await client.getUserContext(user.userName, true);
            if (checkUser && checkUser.isEnrolled()) {
                logger.debug('Successfully loaded member from persistence');
                return {
                    success: true,
                    message: `Successfully loaded ${user.userName} from persistence.`,
                };
            } else {
                let enrollResponse = await client.setUserContext({
                    username: user.userName,
                    password: user.enrollmentSecret
                });
                logger.debug('Successfully enrolled userName %s and setUserContext on the client object', user.userName);

                if (enrollResponse && enrollResponse.isEnrolled) {
                    return {
                        success: true,
                        message: `Enrolled ${user.userName} successfully.'`,
                    };
                } else {
                    throw new Error('Failed to enroll user: %s', user.userName);
                }
            }
        } catch (error) {
            logger.error('Failed to get registered user: %s with error: %s', user.userName, error.toString());
            throw new Error(`Failed to get registered user: ${user.userName} with error: ${error.toString()}`);
        }
    };

    /**
     * tlsEnroll
     * @param {Client} client 
     */
    async tlsEnroll(client) {
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
}

module.exports = CAService;