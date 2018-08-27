/**
observable accounts and setup subscriptions

@method observableAccounts

*/
const accounts = {};

function added(account) {}

function changed(newAccount) {}

function removed(account) {}

function refresh(account) {
  return new Promise((resolve, reject) => {
     eos.getAccount(account.account_name).then(
      _account => {
        _account.account_name = account.account_name;
        _account._id = account.account_name;
        _account.address = account.account_name;
        _account.creating = false;
        _account.loading = false;
        _account.publicKey = account.publicKey;
        _account.multiSig_perm = _getPerms(_account);
        accounts[account.account_name] = _account;
        eos.getCurrencyBalance('eosio.token', account.account_name).then(
          res => {
            if (res.length > 0)
              accounts[account.account_name].eosBalance = {
                value: res[0].split(' ')[0],
                symbol: res[0].split(' ')[1]
              };
            resolve(_account);
          },
          err => {
            console.error(err);
            reject(err)
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
          eosBalance: { value: 0, symbol: 'EOS' }
        })
      }
    );
  })
}

function init() {
  let self = this;
  self.accounts = {};
  for (var i = 0; i < localStorage.length; i++) {
    let key = localStorage.key(i);
    if (key.indexOf('EOS_ACCOUNT') >= 0) {
      let cid = key.split('_')[0];
      let name = key.split('_')[1];
      let publicKey = key.split('_')[2];
      eos.getAccount(name).then(
        account => {
          account.name = name;
          account._id = name;
          account.address = name;
          account.creating = false;
          account.publicKey = publicKey;
          account.multiSig_perm = _getPerms(account);
          self.accounts[name] = account;
          eos.getCurrencyBalance('eosio.token', name).then(
            res => {
              if (res.length > 0)
                self.accounts[name].eosBalance = {
                  value: res[0].split(' ')[0],
                  symbol: res[0].split(' ')[1]
                };
            },
            err => {
              console.error(err);
            }
          );
        },
        err => {
          self.accounts[name] = {
            name: name,
            _id: name,
            address: name,
            creating: true,
            publicKey: publicKey,
            eosBalance: { value: 0, symbol: 'EOS' }
          };
        }
      );
    }
  }
}

function _getPerms(account) {
  let perms = [];
  account.permissions.map(item => {
    if (item.perm_name === 'active') {
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
  init: init,
  refresh: refresh
};

module.exports.observableAccounts = observableAccounts;
