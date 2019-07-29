# Akachain Node SDK
Dapp node sdk with metrics configuration

### Prerequisites

```
npm install fabric-ca-client
```

### Installing

```
npm install akc-node-sdk
```

### How to use

```
// import sdk
const akcSdk = require('akc-node-sdk');

...
// invoke example
const invokeResult = await akcSdk.invoke(peerNames, channelName, chaincodeName, fcn, args, username, org_name);

```

### Functions
| Function | Parameters | Note |
| --- | --- | --- |
| `invoke` | peerNames, channelName, chaincodeName, fcn, args, username, org_name | |
| `query` | channelName, chaincodeName, args, fcn, org_name | |
| `getBlockByNumber` | peer, channelName, blockNumber, username, org_name | |
| `getTransactionByID` | peer, channelName, trxnID, username, org_name | |
| `getBlockByHash` | peer, channelName, hash, username, org_name | |
| `getChainInfo` | peer, channelName, username, org_name | |
| `getInstalledChaincodes` | peer, channelName, type, username, org_name | |
| `getChannels` | peer, username, org_name | |
| `getClientForOrg` | userorg, username | |
| `registerUser` | username, userOrg, isJson | |
| `tlsEnroll` | client | |
| `setFilePath` | file_path | set path of log file before use getLogger() function (default: './logs/') |
| `getLogger` | moduleName | |
| `crawlBlock` | blockNumberOrHash, option | |
