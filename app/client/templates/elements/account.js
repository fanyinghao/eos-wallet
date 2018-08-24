const keystore = require("../../lib/eos/keystore");
import {
  extend
} from '../../lib/utils'
/**
Template Controllers

@module Templates
*/

/**
The account template

@class [template] elements_account
@constructor
*/

Template.elements_account.created = function() {
  let self = this
  let name = this.data.name
  let account = {
    loading: true,
    account_name: name,
    publicKey: keystore.Get(name).publicKey
  }
  TemplateVar.set(self, 'account', account)

  Tracker.autorun(() => {
    eos.getAccount(name).then(_account => {
      account = extend({}, account, _account)
      account.loading = false;
      account.creating = false;
      account.permissions.map(item => {
        if (item.perm_name === "active") {
          let isMultiSig = item.required_auth.threshold > 1;
          if(isMultiSig) {
            account.multiSig_perm = Array.prototype.map.call(
              item.required_auth.accounts,
              item => {
                item.permission.name = item.permission.actor;
                return item.permission;
              }
            );
          }
        }
      })
      ObservableAccounts.accounts[name] = account;
      TemplateVar.set(self, 'account', account)
    }, err => {
      account = extend({}, account, {creating: true, loading: false})
      TemplateVar.set(self, 'account', account)
    })
    eos.getCurrencyBalance('eosio.token', name).then(res => {
        TemplateVar.set(self, 'balance', res);
      }, err => {
      //console.log(err)
    })
  })
};

Template.elements_account.rendered = function() {
  // initiate the geo pattern
  var pattern = GeoPattern.generate(this.data.name);
  this.$('.account-pattern').css('background-image', pattern.toDataUrl());
};

Template.elements_account.helpers({
  /**
    Get the current account

    @method (account)
    */
  account: function() {
    let account = TemplateVar.get('account')
    return account;
  },
  /**
    Get the tokens balance

    @method (formattedTokenBalance)
    */
  formattedTokenBalance: function(e) {
    var balance = TemplateVar.get('balance'); 
    if(!balance || balance.length === 0) 
      balance = ["0.0000 EOS"]
    return balance[0];
  },
  /**
    Account was just added. Return true and remove the "new" field.

    @method (new)
    */
  new: function() {
    return false
  },
  /**
    Displays ENS names with triangles
    @method (nameDisplay)
    */
  displayName: function() {
    return this.account_name;
  }
});

Template.elements_account.events({
  /**
    Field test the speed wallet is rendered

    @event click button.show-data
    */
  'click .wallet-box': function(e) {
  }
});
