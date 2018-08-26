/**
Template Controllers

@module Templates
*/

/**
The dashboard template

@class [template] views_dashboard
@constructor
*/

// Template.views_dashboard.onCreated(function() {
//   ObservableAccounts.init();
// })

Template['views_dashboard'].helpers({
  /**
    Get all current accounts

    @method (accounts)
    */
  accounts: function() {
    let accounts = []
    for (var i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);
      if(key.indexOf('EOS_ACCOUNT') >= 0) {
        let name = key.substring(12);
        let account = {
          name: name,
          publicKey: localStorage[key].publicKey,
          new: this.new === name
        }
        accounts.push(account);
      }
    }
    return accounts;
  },
  /**
    Are there any accounts?

    @method (hasAccounts)
    */
  hasAccounts: function() {
    for (var i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);
      if(key.indexOf('EOS_ACCOUNT_') >= 0)
        return true;
    }
    return false;
  },
  /**
    Get all transactions

    @method (allTransactions)
    */
  allTransactions: function() {
    return [];
  },
  /**
    Returns an array of pending confirmations, from all accounts

    @method (pendingConfirmations)
    @return {Array}
    */
  pendingConfirmations: function() {
    return [];
  }
});

Template['views_dashboard'].events({
  /**
    Request to create an account in mist

    @event click .create.account
    */
  'click .create.account': function(e) {
    e.preventDefault();
  }
});
