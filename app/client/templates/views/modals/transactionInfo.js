/**
Template Controllers

@module Templates
*/

/**
The transaction info template

@class [template] views_modals_transactionInfo
@constructor
*/

Template['views_modals_transactionInfo'].helpers({
  /**
    Returns the current transaction

    @method (transaction)
    @return {Object} the current transaction
    */
  transaction: function() {
    // return Transactions.findOne(this._id);
    return {blockHash:"0x8fe8f57c06957a3a4e7d2d83833eba6c5efd77993c2e51477855cd6e9c6cdda6",
    blockNumber:3936222,
    confirmed:true,
    contractAddress:null,
    contractName:undefined,
    data:null,
    fee:"21000000000000",
    from:"0xef05366bb70acb3d5020afccfb10caf8a920b334",
    gasLimit:121000,
    gasPrice:"1000000000",
    gasUsed:21000,
    jsonInterface:undefined,
    outOfGas:false,
    timestamp:1535595328,
    to:"0x59c15cE4518dEb8b6d20e8Ec51024e292aDc764D",
    tokenId:undefined,
    transactionHash:"0x304269d68e4f91ad7df5cb3b65a83dbf84aba8a8bdfdde0481353ddfd1a463f1",
    transactionIndex:7,
    value:"1100000000000000000",
    _id:"tx_304269d68e"};
  },
  /**
    Calculates the confirmations of this tx

    @method (confirmations)
    @return {Number} the number of confirmations
    */
  confirmations: function() {
    return EthBlocks.latest && this.blockNumber
      ? EthBlocks.latest.number + 1 - this.blockNumber
      : 0;
  },
  /**
    Token value

    @method (tokenValue)
    */
  tokenValue: function() {
    var token = Tokens.findOne(this.tokenId);

    return token
      ? Helpers.formatNumberByDecimals(this.value, token.decimals) +
          ' ' +
          token.symbol
      : this.value;
  },
  /**
    Gas Price per million

    @method (gasPricePerMillion)
    */
  gasPricePerMillion: function() {
    return this.gasPrice * 1000000;
  }
});
