const keystore = require('../../lib/eos/keystore');
import { extend } from '../../lib/utils';
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
  let self = this;
  let name = this.data.name;
  let item = keystore.Get(name);
  let account = {
    loading: true,
    account_name: name
  };
  if (item) {
    account.publicKey = item.publicKey;
    TemplateVar.set(self, 'account', account);
  }
  Tracker.autorun(() => {
    ObservableAccounts.refresh(account).then(
      _account => {
        account = extend({}, account, _account);
        TemplateVar.set(self, 'account', account);
      },
      err => {
        console.error(err);
      }
    );
  });
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
    let account = TemplateVar.get('account');
    return account;
  },
  /**
    Get the tokens balance

    @method (formattedTokenBalance)
    */
  formattedTokenBalance: function(e) {
    var account = TemplateVar.get('account');
    if (!account || !account.eosBalance) return ['0.0000 EOS'];
    return `${account.eosBalance.value} ${account.eosBalance.symbol}`;
  },
  /**
    Account was just added. Return true and remove the "new" field.

    @method (new)
    */
  new: function() {
    return false;
  },
  /**
    Displays ENS names with triangles
    @method (nameDisplay)
    */
  displayName: function() {
    return this.account_name;
  }
});

Template['elements_account'].events({
  'click .creating': function(e) {
    console.log('click');
    e.preventDefault();
    Helpers.copyAddress(e.currentTarget.querySelector('.account-id'));
  }
});
