// const SecureStorage = require('../../lib/eosjs-SecureStorage/lib')
// const {SecureStorage} = require('secure-storage-js')
import {SecureStorage} from '../../lib/eosjs-SecureStorage/lib'
/**
Template Controllers

@module Templates
*/

/**
The dashboard template

@class [template] views_dashboard
@constructor
*/

Template['views_dashboard'].helpers({
  /**
    Get all current accounts

    @method (accounts)
    */
  accounts: function() {
    const storage = new SecureStorage({id:'EOS_ACCOUNT'})
    let accounts = []
    for (var i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);
      if(key.indexOf('EOS_ACCOUNT') >= 0) {
        let name = key.substring(12).split('_')[0];
        let publicKey = key.substring(12).split('_')[1];
        accounts.push({name: name, publicKey: publicKey});
      }
    }
    // balance need to be present, to show only full inserted accounts (not ones added by mist.requestAccount)
    // var accounts = EthAccounts.find(
    //   { name: { $exists: true } },
    //   { sort: { name: 1 } }
    // ).fetch();

    // accounts.sort(Helpers.sortByBalance);

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
    return Transactions.find({}, { sort: { timestamp: -1 } }).count();
  },
  /**
    Returns an array of pending confirmations, from all accounts

    @method (pendingConfirmations)
    @return {Array}
    */
  pendingConfirmations: function() {
    return _.pluck(
      PendingConfirmations.find({
        operation: { $exists: true },
        confirmedOwners: { $ne: [] }
      }).fetch(),
      '_id'
    );
  }
});

Template['views_dashboard'].events({
  /**
    Request to create an account in mist

    @event click .create.account
    */
  'click .create.account': function(e) {
    e.preventDefault();

    mist.requestAccount(function(e, accounts) {
      if (!e) {
        if (!_.isArray(accounts)) {
          accounts = [accounts];
        }
        accounts.forEach(function(account) {
          account = account.toLowerCase();
          EthAccounts.upsert(
            { address: account },
            {
              $set: {
                address: account,
                new: true
              }
            }
          );
        });
      }
    });
  }
});
