/**
Template Controllers

@module Templates
*/

/**
The proposal row template

@class [template] elements_proposal_table
@constructor
*/

/**
The default limit, of none is given.

@property defaultLimit
@type Number
*/
var defaultLimit = 30;
var reactive_proposals = new ReactiveVar();
Template.elements_proposal_table.onRendered(function() {
  let self = this;
  self.reactive_accounts = Blaze.currentView.parentView.templateInstance().reactiveVar;

  Tracker.autorun(function() {
    let accounts = self.reactive_accounts.get();
    let proposals = [];
    let account_names = {};
    Array.prototype.forEach.call(Object.keys(accounts), account => {
      if (accounts[account].permissions) {
        Array.prototype.forEach.call(
          accounts[account].permissions,
          permission => {
            Array.prototype.forEach.call(
              permission.required_auth.accounts,
              acc => {
                account_names[acc.permission.actor] = "";
              }
            );
          }
        );
      }
    });
    console.log(account_names);
    Array.prototype.forEach.call(Object.keys(account_names), name => {
      Helpers.getLatestProposals(name).then(res => {
        proposals = proposals.concat(res);
        reactive_proposals.set(proposals);
      });
    });
  });
});

Template["elements_proposal_table"].helpers({
  /**
    Changes the limit of the given cursor

    @method (items)
    @return {Object} The items cursor
    */
  items: function() {
    let proposals = reactive_proposals.get();
    return proposals;
  },
  hasItems: function() {
    let proposals = reactive_proposals.get();
    return proposals.length > 0;
  }
});

Template["elements_proposal_table"].events({
  "click button.show-more": function(e, template) {}
});

/**
The transaction row template

@class [template] elements_transactions_row
@constructor
*/

Template["elements_proposals_row"].helpers({
  jsonOptions: function() {
    return {
      collapsed: true
    };
  },
  /**
    Returns the from now time, if less than 23 hours

    @method (fromNowTime)
    @return {String}
    */
  fromNowTime: function() {
    Helpers.rerun["10s"].tick();
    var diff = moment().diff(moment.unix(this.block_time), "hours");
    return diff < 23 ? " " + moment.unix(this.block_time).fromNow() : "";
  },
  typeName: function() {
    return `wallet.transactions.types.${this.name}`;
  }
});

Template["elements_proposals_row"].events({
  /**
    Open transaction details on click of the <tr>

    @event click tr
    */
  "click tr:not(.pending)": function(e) {
    var $element = $(e.target);
    if (!$element.is("button") && !$element.is("a")) {
      EthElements.Modal.show(
        {
          template: "views_modals_transactionInfo",
          data: this
        },
        {
          class: "transaction-info"
        }
      );
    }
  }
});
