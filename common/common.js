const helper = require('./client');

global.CLIENT = null;
global.CHANNEL = null;
global.ORG_NAME = '';

// Get an instance of client initialized with the network end points
const getClient = async (orgName, userName) => {

  const strOrgName = orgName || ORG_NAME;

  // if (strOrgName != ORG_NAME) {
  //   return await helper.getClientForOrg(strOrgName, userName);
  // }

  if (CLIENT) {
    return CLIENT;
  } else {
    CLIENT = await helper.getClientForOrg(strOrgName, userName);
    return CLIENT;
  }
};

const getChannel = async (orgName, userName, channelName) => {
  const strOrgName = orgName || ORG_NAME;

  // if (strOrgName != ORG_NAME) {
  //   const client = await helper.getClientForOrg(strOrgName, userName);
  //   return client.getChannel(channelName);
  // }

  if (CHANNEL) {
    return CHANNEL;
  } else {
    if (!CLIENT) {
      await getClient(strOrgName, userName);
    }
    CHANNEL = CLIENT.getChannel(channelName);
    return CHANNEL;
  }
};

module.exports = {
  getClient, getChannel
};