import { extend } from "../../lib/utils";
const keystore = require("../../lib/eos/keystore");
/**
observable accounts and setup subscriptions

@method observableAccounts

*/
const accounts = {};

function added(account) {}

function changed(newAccount) {}

function removed(account) {}

function refresh(account) {
  let self = this;
  return new Promise((resolve, reject) => {
    let item = keystore.Get(account.account_name);
    if (item) {
      account.publicKey = item.publicKey;
    }
    eos.getAccount(account.account_name).then(
      _account => {
        _account.account_name = account.account_name;
        _account._id = account.account_name;
        _account.address = account.account_name;
        _account.creating = false;
        _account.loading = false;
        _account.multiSig_perm = _getPerms(_account);
        _account = extend({}, account, _account);

        eos.getCurrencyBalance("eosio.token", account.account_name).then(
          res => {
            if (res.length > 0) {
              _account.eosBalance = {
                value: res[0].split(" ")[0],
                symbol: res[0].split(" ")[1]
              };
            }
            self.accounts[account.account_name] = _account;
            resolve(_account);
          },
          err => {
            console.error(err);
            reject(err);
          }
        );
      },
      err => {
        resolve({
          account_name: account.account_name,
          _id: account.account_name,
          address: account.account_name,
          creating: true,
          publicKey: account.publicKey,
          eosBalance: { value: 0, symbol: "EOS" }
        });
      }
    );
  });
}

function _getPerms(account) {
  let perms = [];
  account.permissions.map(item => {
    if (item.perm_name === "active") {
      let isMultiSig = item.required_auth.threshold > 1;
      if (isMultiSig) {
        perms = Array.prototype.map.call(item.required_auth.accounts, item => {
          item.permission.name = item.permission.actor;
          return item.permission;
        });
      }
    }
  });
  return perms;
}

var observableAccounts = {
  accounts: accounts,
  refresh: refresh
};

module.exports.observableAccounts = observableAccounts;
