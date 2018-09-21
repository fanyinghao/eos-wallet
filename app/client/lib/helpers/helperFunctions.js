const Fcbuffer = require("fcbuffer");

/**
Helper functions

@module Helpers
**/

/**
The Helpers class containing helper functions

@class Helpers
@constructor
**/
Helpers = {};

/**
Reruns functions reactively, based on an interval. Use it like so:

    Helpers.rerun['10s'].tick();


@method rerun
**/
Helpers.rerun = {
  "10s": new ReactiveTimer(10),
  "1s": new ReactiveTimer(1)
};

/**
Sort method for accounts and wallets to sort by balance

@method sortByBalance
**/
Helpers.sortByBalance = function(a, b) {
  return !b.disabled &&
    new BigNumber(b.balance, 10).gt(new BigNumber(a.balance, 10))
    ? 1
    : -1;
};

/**
Clear localStorage

@method getLocalStorageSize
**/
Helpers.getLocalStorageSize = function() {
  var size = 0;
  if (localStorage) {
    _.each(Object.keys(localStorage), function(key) {
      size += (localStorage[key].length * 2) / 1024 / 1024;
    });
  }

  return size;
};

/**
Make a ID out of a given hash and prefix.

@method makeId
@param {String} prefix
@param {String} hash
*/
Helpers.makeId = function(prefix, hash) {
  return _.isString(hash)
    ? prefix + "_" + hash.replace("0x", "").substr(0, 10)
    : null;
};

/**
Display logs in the console for events.

@method eventLogs
*/
Helpers.eventLogs = function() {
  console.log("EVENT LOG: ", arguments);
};

/**
Shows a notification and plays a sound

@method showNotification
@param {String} i18nText
@param {Object} the i18n values passed to the i18n text
*/
Helpers.showNotification = function(i18nText, values, callback) {
  if (Notification.permission === "granted") {
    var notification = new Notification(
      TAPi18n.__(i18nText + ".title", values),
      {
        // icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
        body: TAPi18n.__(i18nText + ".text", values)
      }
    );

    if (_.isFunction(callback)) notification.onclick = callback;
  }
  if (typeof mist !== "undefined") mist.sounds.bip();
};

/**
Returns a string, given an account anme

@method getAccountByName
**/
Helpers.getAccountByName = function(name) {
  return new Promise((resolve, reject) => {
    eos.getAccount(name).then(
      account => {
        resolve(account);
      },
      err => {
        reject(err);
      }
    );
  });
};

/**
Returns a error handler

@method handleError
**/
Helpers.handleError = e => {
  console.log(e);
  if (
    e.message === "wrong password" ||
    e.message === "gcm: tag doesn't match"
  ) {
    GlobalNotification.warning({
      content: "i18n:wallet.accounts.wrongPassword",
      duration: 2
    });
    return;
  } else {
    GlobalNotification.warning({
      content: e.message,
      duration: 5
    });
    return;
  }
};

/**
Returns a bool if an account is MultiSig

@method (isMultiSig)
**/
Helpers.isMultiSig = function(account) {
  let isMultiSig = false;
  let _account = account;

  if (typeof account === "string")
    _account = ObservableAccounts.accounts[account];

  if (!_account || !_account.permissions) return false;

  _account.permissions.map(item => {
    if (item.perm_name === "active") {
      isMultiSig = item.required_auth.threshold > 1;
    }
  });
  return isMultiSig;
};

/**
Translate an external error message into the user's language if possible. Otherwise return
the old error message.

@method translateExternalErrorMessage
*/
Helpers.translateExternalErrorMessage = function(message) {
  // 'setTxStatusRejected' occurs in the stack trace of the error message triggered when
  // the user has rejects a transaction in MetaMask. Show a localised error message
  // instead of the stack trace.
  let ret = `[${message.code}] - [${message.name}] - ${message.what}`;
  if (message.details && message.details.length > 0)
    ret += ` - ${message.details[0].message}`;
  return ret;
};

/**
Reactive wrapper for the moment package.

@method moment
@param {String} time    a date object passed to moment function.
@return {Object} the moment js package
**/
Helpers.moment = function(time) {
  // react to language changes as well
  TAPi18n.getLanguage();

  time = time + "+0000";
  if (_.isFinite(time) && moment.unix(time).isValid()) return moment.unix(time);
  else return moment(time);
};

/**
Formats a timestamp to any format given.

    Helpers.formatTime(myTime, "YYYY-MM-DD")

@method formatTime
@param {String} time         The timestamp, can be string or unix format
@param {String} format       the format string, can also be "iso", to format to ISO string, or "fromnow"
@return {String} The formated time
**/
Helpers.formatTime = function(time, format) {
  //parameters

  // make sure not existing values are not Spacebars.kw
  if (format instanceof Spacebars.kw) format = null;

  if (time) {
    if (_.isString(format) && !_.isEmpty(format)) {
      if (format.toLowerCase() === "iso")
        time = Helpers.moment(time).toISOString();
      else if (format.toLowerCase() === "fromnow") {
        // make reactive updating
        Helpers.rerun["10s"].tick();
        time = Helpers.moment(time).fromNow();
      } else time = Helpers.moment(time).format(format);
    }

    return time;
  } else return "";
};

/**
Gets the docuement matching the given addess from the EthAccounts or Wallets collection.

@method getAccountByAddress
@param {String} address
@param {Boolean} reactive
*/
Helpers.getAccountByAddress = function(address, reactive) {
  var options = reactive === false ? { reactive: false } : {};
  // if(_.isString(address))
  //     address = address.toLowerCase();
  return address;
};

/**
Formats a given transactions balance

    Helpers.formatTransactionBalance(tx)

@method formatTransactionBalance
@param {String} value  the value to format
@param {Object} exchangeRates  the exchange rates to use
@param {String} unit  the unit to format to
@return {String} The formated value
**/
Helpers.formatTransactionBalance = function(value, exchangeRates, unit) {
  // make sure not existing values are not Spacebars.kw
  if (unit instanceof Spacebars.kw) unit = null;

  var unit = unit || EthTools.getUnit(),
    format = "0,0.00";

  if (
    (unit === "usd" || unit === "eur" || unit === "btc") &&
    exchangeRates &&
    exchangeRates[unit]
  ) {
    if (unit === "btc") format += "[000000]";
    else format += "[0]";

    var price = new BigNumber(String(value), 10).times(
      exchangeRates[unit].price
    );
    return EthTools.formatNumber(price, format) + " " + unit.toUpperCase();
  } else {
    return EthTools.formatBalance(value, format + "[0000000000000000] UNIT");
  }
};

Helpers.getActions = (name, pos, offset, callback) => {
  eos.getActions(name, pos, offset).then(res => {
    callback(
      res.actions
        .filter(item => {
          if (item.action_trace.act.name !== "transfer") return true;
          else if (item.action_trace.act.data.to === name) return true;
          return (
            item.action_trace.act.data.from ===
            item.action_trace.receipt.receiver
          );
        })
        .map(item => {
          item.isIncoming = name === item.action_trace.act.data.to;
          return item;
        })
        .sort((a, b) => {
          if (a.account_action_seq > b.account_action_seq) return -1;
          if (a.account_action_seq < b.account_action_seq) return 1;
          return 0;
        })
    );
  });
};

Helpers.getActiveKeys = account => {
  let _account = account;
  let ret = [];
  if (!_account || !_account.permissions) return [];

  _account.permissions.forEach(item => {
    if (item.perm_name === "active") {
      ret = ret.concat(
        item.required_auth.accounts.map(account => {
          return account.permission.actor;
        })
      );
    }
  });
  return ret;
};

Helpers.getProposals = account => {
  let keys = Helpers.getActiveKeys(account);

  let func = keys.map(key =>
    eos.getTableRows({
      json: true,
      code: "eosio.msig",
      scope: key,
      table: "approvals",
      limit: 0
    })
  );

  return Promise.all(func);
};

Helpers.copyAddress = element => {
  var selection = window.getSelection();
  var range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);

  try {
    document.execCommand("copy");

    GlobalNotification.info({
      content: "i18n:wallet.accounts.addressCopiedToClipboard",
      duration: 3
    });
  } catch (err) {
    GlobalNotification.error({
      content: "i18n:wallet.accounts.addressNotCopiedToClipboard",
      closeable: false,
      duration: 3
    });
  }
  selection.removeAllRanges();
};

Helpers.getLatestProposals = name => {
  return new Promise((resolve, reject) => {
    eos.getActions(name, -1, -100).then(
      res => {
        resolve(
          res.actions
            .filter(item => {
              if (item.action_trace.act.name === "propose")
                return (
                  moment.utc(item.action_trace.act.data.trx.expiration) >
                  moment.utc()
                );
              return false;
            })
            .map(item => {
              item.action_trace.act.data.trx.actions = Array.prototype.map.call(
                item.action_trace.act.data.trx.actions,
                action => {
                  try {
                    action.origin_data = Fcbuffer.fromBuffer(
                      eos.fc.abiCache.abi(action.account).structs[action.name],
                      Buffer.from(action.data, "hex")
                    );
                    return action;
                  } catch (e) {
                    // Abi 'eosio.xxxx' is not cached
                    eos.getAbi(action.account).then(res => {
                      action.origin_data = Fcbuffer.fromBuffer(
                        eos.fc.abiCache.abi(action.account).structs[
                          action.name
                        ],
                        Buffer.from(action.data, "hex")
                      );
                      return action;
                    });
                  }
                }
              );
              return item;
            })
            .sort((a, b) => {
              if (a.account_action_seq > b.account_action_seq) return -1;
              if (a.account_action_seq < b.account_action_seq) return 1;
              return 0;
            })
        );
      },
      err => {
        reject(err);
      }
    );
  });
};

Helpers.getApprovals = name => {
  return new Promise((resolve, reject) => {
    eos
      .getTableRows({
        json: true,
        code: "eosio.msig",
        scope: name,
        table: "approvals",
        limit: 0
      })
      .then(
        res => {
          resolve(res.rows);
        },
        err => {
          reject(err);
        }
      );
  });
};

Helpers.approveProposal = (
  proposer,
  proposal,
  from,
  signProvider,
  onSuccess,
  onError
) => {
  try {
    const _eos_app = Eos({
      httpEndpoint: httpEndpoint,
      chainId: chainId,
      signProvider: signProvider,
      verbose: false
    });

    _eos_app.contract("eosio.msig").then(msig => {
      msig
        .approve(
          proposer,
          name,
          {
            actor: from,
            permission: "active"
          },
          {
            broadcast: true,
            authorization: `${from}@active`
          }
        )
        .then(tx => {
          msig
            .exec(proposer, proposal, from, {
              broadcast: true,
              authorization: `${from}@active`
            })
            .then(
              exec_tx => {
                onSuccess(exec_tx);
              },
              () => {
                onSuccess(tx);
              }
            );
        }, onError);
    });
  } catch (e) {
    handleError(e);
  }
};
