const helper = require('./client');

global.CLIENT = null;
global.CHANNEL = null;
global.ORG_NAME = '';

const getClient = async (orgName, username) => {

  const strOrgName = orgName || ORG_NAME;

  // if (strOrgName != ORG_NAME) {
  //   return await helper.getClientForOrg(strOrgName, username);
  // }

  if (CLIENT) {
    return CLIENT;
  } else {
    CLIENT = await helper.getClientForOrg(strOrgName, username);
    return CLIENT;
  }
};

const getChannel = async (orgName, username, channelName) => {
  const strOrgName = orgName || ORG_NAME;

  // if (strOrgName != ORG_NAME) {
  //   const client = await helper.getClientForOrg(strOrgName, username);
  //   return client.getChannel(channelName);
  // }

  if (CHANNEL) {
    return CHANNEL;
  } else {
    if (!CLIENT) {
      await getClient(strOrgName);
    }
    CHANNEL = CLIENT.getChannel(channelName);
    return CHANNEL;
  }
};

module.exports = {
  getClient, getChannel
};