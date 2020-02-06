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
    echo "//npm.pkg.github.com/:_authToken=your_token"
    ```

3. Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

    ```bash
    npm install @akachain/hstx-node-sdk
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
| `invoke` | peerNames, channelName, chaincodeName, fcn, args, orgName, userName | |
| `query` | peerNames, channelName, chaincodeName, fcn, args, orgName, userName | |
| `getBlockByNumber` | peer, channelName, blockNumber, orgName, userName | |
| `getTransactionByID` | peer, channelName, trxnID, orgName, userName | |
| `getBlockByHash` | peer, channelName, hash, orgName, userName | |
| `getChainInfo` | peer, channelName, orgName, userName | |
| `getInstalledChaincodes` | peer, channelName, type, orgName, userName | |
| `getChannels` | peer, orgName, userName | |
| `getClientForOrg` | userorg, userName | |
| `registerUser` | userName, userOrg, isJson | |
| `tlsEnroll` | client | |
| `setFilePath` | file_path | set path of log file before use getLogger() function (default: './logs/') |
| `getLogger` | moduleName | |
| `crawlBlock` | blockNumberOrHash, option | |
