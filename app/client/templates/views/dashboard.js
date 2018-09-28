const keystore = require("../../lib/eos/keystore");
/**
Template Controllers

@module Templates
*/

/**
The dashboard template

@class [template] views_dashboard
@constructor
*/
var reactive_node = new ReactiveVar(localStorage.getItem("chain_node"));
var reactiveAccounts = new ReactiveVar([]);

Template.views_dashboard.created = function() {
  let self = this;
  self.reactive_proposer = new ReactiveVar({});
  self.reactive_refreshed_count = new ReactiveVar(0);
  self.reactive_refreshed_done = new ReactiveVar(false);

  Tracker.autorun(() => {
    let _node = reactive_node.get();
    let _accounts = [];

    for (var i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);

      if (key.indexOf("EOS_ACCOUNT") >= 0) {
        let cid = key.substring(12).split("_")[0];

        if (cid === chains[_node].chainId) {
          let name = key.substring(12).split("_")[1];
          let account = {
            name: name,
            publicKey: localStorage[key].publicKey,
            new: this.new === name
          };
          _accounts.push(account);
        }
      }
    }
    reactiveAccounts.set(_accounts);
    self.reactive_refreshed_done.set(
      self.reactive_refreshed_count.get() === _accounts.length
    );
    reactive_node.set(_node);
  });
};

Template["views_dashboard"].helpers({
  /**
    Get all current accounts

    @method (accounts)
    */
  accounts: function() {
    let accounts = reactiveAccounts.get();
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
    reactive_node.set(_node);
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
    let ret = value === localStorage.getItem("chain_node") ? "selected" : "";
    return ret;
  },
  version: function() {
    if (!Meteor.settings.public.commit) return "";
    return Meteor.settings.public.commit.substring(0, 7);
  }
});

Template["views_dashboard"].events({
  /**
    Request to create an account in mist

    @event click .create.account
    */
  "click .create.account": function(e) {
    e.preventDefault();
  },

  "change select[name=chain_node]": function(e, template) {
    reload_chain(e.target.value);
    reactive_node.set(e.target.value);
    reactiveAccounts.set([]);

    console.log("clicked");
  },
  "click .wallet-box-remove": function(e) {
    let accounts = reactiveAccounts.get();
    let name = e.currentTarget.dataset.name;
    keystore.Remove(name);
    reactiveAccounts.set(
      accounts.filter(e => {
        return e.name !== name;
      })
    );
  }
});
