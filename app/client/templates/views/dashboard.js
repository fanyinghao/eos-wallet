/**
Template Controllers

@module Templates
*/

/**
The dashboard template

@class [template] views_dashboard
@constructor
*/
var reactive_node = new ReactiveVar(localStorage.getItem('chain_node'));

Template['views_dashboard'].helpers({
  /**
    Get all current accounts

    @method (accounts)
    */
  accounts: function() {
    let accounts = [];
    let _node = reactive_node.get();

    for (var i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);

      if (key.indexOf('EOS_ACCOUNT') >= 0) {
        let cid = key.substring(12).split('_')[0];

        if (cid === chains[_node].chainId) {
          let name = key.substring(12).split('_')[1];
          let account = {
            name: name,
            publicKey: localStorage[key].publicKey,
            new: this.new === name
          };
          accounts.push(account);
        }
      }
    }
    reactive_node.set(_node)
    console.log("recompute accounts");
    return accounts;
  },
  /**
    Are there any accounts?

    @method (hasAccounts)
    */
  hasAccounts: function() {
    let _node = reactive_node.get();

    for (var i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);
      if (key.indexOf(`EOS_ACCOUNT_${chains[_node].chainId}`) >= 0) return true;
    }
    reactive_node.set(_node)
    console.log("recompute hasAccounts");

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
  },
  chain_nodes: function() {
    return Object.keys(chains);
  },
  selected: function(value) {
    let ret = value === localStorage.getItem('chain_node')? 'selected': '';
    return ret;
  }
});

Template['views_dashboard'].events({
  /**
    Request to create an account in mist

    @event click .create.account
    */
  'click .create.account': function(e) {
    e.preventDefault();
  },

  'change select[name=chain_node]': function(e, template) {
    reload_chain(chains[e.target.value])
    localStorage.setItem('chain_node', e.target.value);
    reactive_node.set(e.target.value);
    console.log('clicked');
  }
});
