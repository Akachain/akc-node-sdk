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
const invokeResult = await akcSdk.invoke(peerNames, channelName, chaincodeName, fcn, args, orgName, userName);

```

### Functions
| Function | Parameters | Note |
| --- | --- | --- |
| `invoke` | peerNames, channelName, chaincodeName, fcn, args, orgName, userName | |
| `query` | channelName, chaincodeName, args, fcn, orgName | |
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
