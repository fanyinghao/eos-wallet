/**
Helper functions

@module Helpers
**/

/**
Global template helpers

@class TemplateHelpers
@constructor
**/

/**
A simple template helper to log objects in the console.

@method (debug)
**/
Template.registerHelper("debug", function(object) {
  console.log(object);
});

/**
Check if in mist

@method (isMist)
**/
Template.registerHelper("isMist", function() {
  return window.mistMode === undefined && window.mist !== undefined;
});

/**
Check if in mist and in mist mode

@method (isWalletMode)
**/
Template.registerHelper("isWalletMode", function() {
  // also show network info in normal browsers
  return window.mistMode === "wallet" || window.mist === undefined;
});

/**
Check if wallet was loaded from browser other than Mist

@method (isBrowserMode)
**/
Template.registerHelper("isBrowserMode", function() {
  return window.mist === undefined;
});

/**
Check if currency unit is an ether unit

@method (isEtherUnit)
**/
Template.registerHelper("isEtherUnit", function() {
  var unit = EthTools.getUnit();
  return !(
    unit === "usd" ||
    unit === "eur" ||
    unit === "btc" ||
    unit === "gbp" ||
    unit === "brl"
  );
});

/**
Check if wallet has vulnerabilities

@method (isVulnerable)
@param {String} address and address of a wallet/account
**/
Template.registerHelper("isVulnerable", function(address) {
  var account = _.isString(address)
    ? Helpers.getAccountByAddress(address)
    : this;

  if (!account) return;

  // check if is wallet and is vulnerable
  if (
    _.find(account.vulnerabilities || [], function(vul) {
      return vul;
    })
  ) {
    return account;
  }

  // check if is owner account and is vulnerable
  var wallets = _.map(
    Wallets.find({ vulnerabilities: { $exists: true } }).fetch(),
    function(wal) {
      return !!_.find(wal.vulnerabilities || [], function(vul) {
        return vul;
      })
        ? wal
        : false;
    }
  );
  var wallet = _.find(wallets, function(wal) {
    return _.contains(wal.owners, account.address);
  });

  if (wallet) {
    // add vulnerabilities to account
    account.vulnerabilities = wallet.vulnerabilities;
    return account;
  } else return false;
});

/**
Return the current unit

@method (unit)
**/
Template.registerHelper("unit", function() {
  return EthTools.getUnit();
});

/**
Return the latest block

@method (latestBlock)
**/
Template.registerHelper("latestBlock", function() {
  return EthBlocks.latest;
});

/**
Returns a list of accounts and wallets sorted by balance

@method (selectAccounts)
**/
Template.registerHelper("selectAccounts", function(ignoreMultiSig, range) {
  if (Object.keys(ObservableAccounts.accounts).length === 0)
    FlowRouter.go("dashboard");
  return Object.values(ObservableAccounts.accounts)
    .filter(item => {
      return (
        !item.creating &&
        !(ignoreMultiSig && Helpers.isMultiSig(item)) &&
        (!(
          range &&
          Object.prototype.toString.call(range) === "[object Array]" &&
          range.length > 0
        ) ||
          range.includes(item.account_name))
      );
    })
    .sort((a, b) => {
      return a.account_name > b.account_name;
    });
});

/**
Check if the given wallet is a watch only wallet, by checking if we are one of owners in the wallet.

@method (isWatchOnly)
@param {String} id the id of the wallet to check
**/
Template.registerHelper("isWatchOnly", Helpers.isWatchOnly);

/**
Return the right wallet icon

@method (walletIcon)
**/
Template.registerHelper("walletIcon", function() {
  var icon = "";

  if (!_.isUndefined(this.owners)) {
    if (Helpers.isWatchOnly(this._id))
      icon = '<i class="icon-eye" title="Watch only"></i>';
    else icon = '<i class="icon-wallet" title="Wallet"></i>';
  } else icon = '<i class="icon-key" title="Account"></i>';

  return new Spacebars.SafeString(icon);
});

/**
Get the account name or display the address

@method (accountNameOrAddress)
@param {String} address
*/
Template.registerHelper("accountNameOrAddress", function(address) {
  if ((account = Helpers.getAccountByAddress(address))) return account.name;
  else return address;
});

/**
Format a number based on decimal numbers

    {{formatNumberByDecimals tokenAmount decimals}}

@method formatNumberByDecimals
@param {Number} number
@param {Number} decimals
*/
Template.registerHelper(
  "formatNumberByDecimals",
  Helpers.formatNumberByDecimals
);

/**
Formats a timestamp to any format given.

    {{formatTime myTime "YYYY-MM-DD"}}

@method (formatTime)
@param {String} time         The timstamp, can be string or unix format
@param {String} format       the format string, can also be "iso", to format to ISO string, or "fromnow"
//@param {Boolean} realTime    Whether or not this helper should re-run every 10s
@return {String} The formated time
**/
Template.registerHelper("formatTime", Helpers.formatTime);

/**
Formats a given transactions balance

    {{formatTransactionBalance value exchangeRates "ether"}}

@method formatTransactionBalance
@param {String} value  the value to format
@param {Object} exchangeRates  the exchange rates to use
@param {String} unit  the unit to format to
@return {String} The formated value
**/
Template.registerHelper(
  "formatTransactionBalance",
  Helpers.formatTransactionBalance
);

/**
Formats address to a CaseChecksum

@method toChecksumAddress
@param {String} address             The address
@return {String} checksumAddress    The returned, checksummed address
**/
Template.registerHelper("toChecksumAddress", function(address) {
  return address;
});

/**
Takes a camelcase and shows it with spaces

@method toSentence
@param {string} camelCase    A name in CamelCase or snake_case format
@return {string} sentence    The same name with spaces
**/
Template.registerHelper("toSentence", Helpers.toSentence);

/**
Check if on main network

@method (isMainNetwork)
**/
Template.registerHelper("isMainNetwork", function() {
  return Session.get("network") === "main";
});

/**
or logic function

@method or
**/
Template.registerHelper("or", (a, b) => {
  return a || b;
});

/**
isMultiSig

@method isMultiSig
**/
Template.registerHelper("isMultiSig", account => {
  return Helpers.isMultiSig(account);
});

/**
parseTrascationId

@method parseTrascationId
**/
Template.registerHelper("parseTrascationId", tx_id => {
  return tx_id.substr(0, 6);
});

/**
parseJSON

@method parseJSON
**/
Template.registerHelper("parseJSON", obj => {
  return JSON.stringify(obj)
    .replace(/\n[\s| | ]*\r/g, "\n")
    .replace(/[\r\n]/g, "")
    .trim();
});

/**
formatBalance

@method formatBalance
**/
Template.registerHelper("formatSymbol", balance => {
  const symbol = balance.split(" ")[1];
  return symbol;
});
