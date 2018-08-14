/**
observable accounts and setup subscriptions

@method observableAccounts

*/
const accounts = {}

function added(account) {
}

function changed(newAccount) {
}

function removed(account) {
}

function init() {
  let self = this
  self.accounts = {}
  for (var i = 0; i < localStorage.length; i++) {
    let key = localStorage.key(i);
    if(key.indexOf('EOS_ACCOUNT') >= 0) {
      let name = key.substring(12).split('_')[0];
      let publicKey = key.substring(12).split('_')[1];
      eos.getAccount(name).then(account => {
        account.name = name;
        account._id = name;
        account.address = name;
        account.creating = false;
        account.publicKey = publicKey;
        self.accounts[name] = account;
        eos.getCurrencyBalance('eosio.token', name).then(res => {
          if(res.length > 0)
            self.accounts[name].eosBalance = { value: res[0].split(' ')[0],symbol: res[0].split(' ')[1] };
        }, err => {
          console.error(err)
        })
      }, err => {
        self.accounts[name] = { name: name, _id: name, address: name, creating: true, publicKey: publicKey, eosBalance: {value: 0, symbol: 'EOS'}};
      })
    }
  }
}

var observableAccounts = {
  accounts: accounts,
  init: init
}

module.exports.observableAccounts = observableAccounts;
