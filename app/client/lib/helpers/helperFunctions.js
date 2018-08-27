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
  '10s': new ReactiveTimer(10),
  '1s': new ReactiveTimer(1)
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
      size += localStorage[key].length * 2 / 1024 / 1024;
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
    ? prefix + '_' + hash.replace('0x', '').substr(0, 10)
    : null;
};

/**
Display logs in the console for events.

@method eventLogs
*/
Helpers.eventLogs = function() {
  console.log('EVENT LOG: ', arguments);
};

/**
Shows a notification and plays a sound

@method showNotification
@param {String} i18nText
@param {Object} the i18n values passed to the i18n text
*/
Helpers.showNotification = function(i18nText, values, callback) {
  if (Notification.permission === 'granted') {
    var notification = new Notification(
      TAPi18n.__(i18nText + '.title', values),
      {
        // icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
        body: TAPi18n.__(i18nText + '.text', values)
      }
    );

    if (_.isFunction(callback)) notification.onclick = callback;
  }
  if (typeof mist !== 'undefined') mist.sounds.bip();
};

/**
Returns a string, given an account anme

@method getAccountByName
**/
Helpers.getAccountByName = function(name) {
  return new Promise((resolve, reject) => {
    eos.getAccount(name).then(account => {
      resolve(account)
    }, err => {
      reject(err)
    })
  })
}

/**
Returns a error handler

@method handleError
**/
Helpers.handleError = (e) => {
  console.log(e);
  if (
    e.message === 'wrong password' ||
    e.message === "gcm: tag doesn't match"
  ) {
    GlobalNotification.warning({
      content: 'i18n:wallet.accounts.wrongPassword',
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
  let isMultiSig = false
  let _account = account

  if(typeof(account) === "string")
    _account = ObservableAccounts.accounts[account];

  if(!_account || !_account.permissions)
    return false;

  _account.permissions.map(item => {
    if (item.perm_name === "active") {
      isMultiSig = item.required_auth.threshold > 1;
    }
  })
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
