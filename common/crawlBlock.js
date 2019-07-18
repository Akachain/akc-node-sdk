const sha = require('js-sha256');
const asn = require('asn1.js');

async function generateBlockHash(header) {
  const headerAsn = asn.define('headerAsn', function () {
    this.seq().obj(
      this.key('Number').int(),
      this.key('PreviousHash').octstr(),
      this.key('DataHash').octstr()
    );
  });
  const output = headerAsn.encode(
    {
      Number: parseInt(header.number),
      PreviousHash: Buffer.from(header.previous_hash, 'hex'),
      DataHash: Buffer.from(header.data_hash, 'hex')
    },
    'der'
  );
  return sha.sha256(output);
}

const crawlBlock = async (blockNumberOrHash, option) => {

  let blockResult = {}
  if (option == 'byNumber') {
    blockResult = await channel.queryBlock(blockNumberOrHash);
  } else {
    let buf = Buffer.from(blockNumberOrHash, "hex");
    blockResult = await channel.queryBlockByHash(buf);
  }
  if (blockResult) {


    let txs = blockResult.data.data;
    if (!txs) return null;
    const data = []
    const tx_code = blockResult.metadata.metadata[blockResult.metadata.metadata.length - 1];

    const block_hash = await generateBlockHash(blockResult.header);
    const header = {
      number: blockResult.header.number,
      previous_hash: blockResult.header.previous_hash,
      data_hash: blockResult.header.data_hash,
      block_hash: block_hash
    }
    blockResult.data.data.forEach(d => {
      let tx = {};
      tx.timestamp = d.payload.header.channel_header.timestamp;
      tx.channel_id = d.payload.header.channel_header.channel_id;
      tx.tx_id = d.payload.header.channel_header.tx_id;
      tx.tx_type = d.payload.header.channel_header.typeString;
      if (d.payload.data.actions[0]) {
        tx.ns_rwset = d.payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset;
      } else {
        tx.ns_rwset = [];
      }
      data.push(tx);
    });
    //block structure to publish to queue
    let block = {
      header,
      data,
      tx_code
    }
    return block;
  } else {
    return null;
  }
}

module.exports = {
  crawlBlock
};