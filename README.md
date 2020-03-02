# Akachain Node SDK
Dapp node sdk with metrics configuration

### Prerequisites

```
npm install fabric-ca-client
```

## Installation

1. Before installing, [download and install Node.js](https://nodejs.org/en/download/).

2. Grant access permission for registry https://npm.pkg.github.com/

    Create file .npmrc
    ```js
    // Linux/MacOS command
    touch .npmrc
    ```
    Config registry to install akaChain SDK
    ```js
    // Linux/MacOS command
    echo "registry=https://npm.pkg.github.com/Akachain" >> .npmrc
    ```
    Get your personal access token on github:
    Access to [gibhub](https://github.com), choose [settings](https://github.com/settings/profile) at right-top of page. Click on _Developer settings_, _Personal access tokens_ then generate your token. Copy it to replace your_token in the following command
    ```js
    // Linux/MacOS command
    echo "//npm.pkg.github.com/:_authToken=your_token" >> .npmrc
    ```

3. Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

    ```bash
    npm install @akachain/akc-node-sdk
    ```


## How to use

```
// import sdk
const akcSdk = require('@akachain/akc-node-sdk');

...
// invoke example
const invokeResult = await akcSdk.invoke(peerNames, channelName, chaincodeName, fcn, args, orgName, userName);

```

### Functions
| Function | Parameters | Note |
| --- | --- | --- |
| `registerUser` | user: { orgname, username, enrollmentSecret (optional), role (optional), affiliation (optional), maxEnrollments (optional), attrs (optional) } | |
| `enrollUser` | user: { orgname, username } | |
| `tlsEnroll` | client | |
| `getClientForOrg` | orgName, userName (optional), isRefresh (optional)| |
| `getChannel` | orgName, userName (optional), channelName, isRefresh (optional)| |
| `invoke` | peerNames, channelName, chaincodeName, fcn, args, orgName, userName | |
| `query` | peerNames, channelName, chaincodeName, fcn, args, orgName, userName | |
| `getBlockByNumber` | peerName, channelName, blockNumber, orgName, userName | |
| `getTransactionByID` | peerName, channelName, trxnID, orgName, userName | |
| `getBlockByHash` | peerName, channelName, hash, orgName, userName | |
| `getChainInfo` | peerName, channelName, orgName, userName | |
| `getInstalledChaincodes` | peerName, channelName, type, orgName, userName | |
| `getLogger` | moduleName | |
| `crawlBlock` | blockNumberOrHash, option | |
| `installChaincode` | orgName, request: { chaincodePath, chaincodeId, metadataPath, chaincodeVersion, chaincodeType } | |
| `initChaincode` | orgName, channelName, request: { chaincodeId, chaincodeVersion, chaincodeType, args } | |
| `upgradeChaincode` | orgName, channelName, request { chaincodeId, chaincodeVersion, chaincodeType, args } | |
