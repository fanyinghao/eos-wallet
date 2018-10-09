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
var reactive_approvals = new ReactiveVar();
var reactive_force_refresh = new ReactiveVar(true);

function is_done(item) {
  let actor = item.action_trace.act.data.trx.actions[0].authorization[0].actor;
  let permission =
    item.action_trace.act.data.trx.actions[0].authorization[0].permission;
  let owner = ObservableAccounts.accounts[actor];
  let approvals = reactive_approvals.get();
  let approval =
    approvals[
      `${item.action_trace.act.data.proposer}.${
        item.action_trace.act.data.proposal_name
      }`
    ];
  let threshold;
  if (!approval) return true;

  owner.permissions.forEach(item => {
    if (item.perm_name === permission) {
      threshold = item.required_auth.threshold;
      return;
    }
  });

  return threshold < approval.provided_approvals.length;
}

Template.elements_proposal_table.onCreated(function() {
  reactive_proposals.set({});
});

Template.elements_proposal_table.onRendered(function() {
  let self = this;
  let parentView = {};

  if (FlowRouter.getRouteName() === "dashboard") {
    parentView = Blaze.currentView.parentView.templateInstance();
  } else if (FlowRouter.getRouteName() === "account") {
    parentView = Blaze.currentView.parentView.parentView.parentView.parentView.templateInstance();
  }

  self.reactive_proposer = parentView.reactive_proposer;
  self.reactive_refreshed_done = parentView.reactive_refreshed_done;

  Tracker.autorun(function() {
    if (!self.reactive_refreshed_done.get()) return;

    let accounts = self.reactive_proposer.get();
    let force_refresh = reactive_force_refresh.get();
    let proposals = [];
    let approvals = {};
    reactive_proposals.set({});

    Array.prototype.forEach.call(Object.keys(accounts), name => {
      Helpers.getLatestProposals(name).then(res => {
        proposals = proposals.concat(res).filter(item => {
          return !is_done(item);
        });
        reactive_proposals.set(proposals);
      });
      Helpers.getApprovals(name).then(res => {
        Array.prototype.forEach.call(res, item => {
          approvals[`${name}.${item.proposal_name}`] = item;
        });
        reactive_approvals.set(approvals);
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
    if (!proposals) return [];
    return proposals;
  },
  hasItems: function() {
    let proposals = reactive_proposals.get();
    if (!proposals) return false;
    return proposals.length > 0;
  }
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
  },
  getApproval: function(proposer, proposal) {
    let approvals = reactive_approvals.get();
    return approvals[`${proposer}.${proposal}`];
  },
  canSign: function() {
    let approvals = reactive_approvals.get();
    let approval =
      approvals[
        `${this.action_trace.act.data.proposer}.${
          this.action_trace.act.data.proposal_name
        }`
      ];
    if (!approval) return true;

    return approval.requested_approvals.some(item => {
      return ObservableAccounts.accounts[item.actor];
    });
  },
  canRevoke: function() {
    let approvals = reactive_approvals.get();
    let approval =
      approvals[
        `${this.action_trace.act.data.proposer}.${
          this.action_trace.act.data.proposal_name
        }`
      ];
    if (!approval) return true;

    return approval.provided_approvals.some(item => {
      return ObservableAccounts.accounts[item.actor];
    });
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
  },
  "click button.dapp-block-button": function(e) {
    let self = this;
    let action = this.action_trace.act.data.trx.actions[0];
    let type = e.target.dataset.type;

    if (action.name === "transfer" && type === "approve") {
      EthElements.Modal.question(
        {
          template: "views_modals_sendTransactionInfo",
          data: {
            from: action.origin_data.from,
            to: action.origin_data.to,
            amount: action.origin_data.amount,
            memo: action.origin_data.memo
          },
          ok: () => {
            pop_auth(self.action_trace.act.data);
          },
          cancel: true
        },
        {
          class: "send-transaction-info"
        }
      );
    } else {
      pop_auth(self.action_trace.act.data);
    }

    function pop_auth(data) {
      let range = [];
      let approvals = reactive_approvals.get();
      let approval = approvals[`${data.proposer}.${data.proposal_name}`];

      if (!approval) {
        if (type === "approve")
          range = data.requested.map(item => {
            return item.actor;
          });
      } else {
        if (type === "approve")
          range = approval.requested_approvals
            .filter(item => {
              return ObservableAccounts.accounts[item.actor];
            })
            .map(item => {
              return item.actor;
            });
        else if (type === "revoke")
          range = approval.provided_approvals
            .filter(item => {
              return ObservableAccounts.accounts[item.actor];
            })
            .map(item => {
              return item.actor;
            });
      }

      EthElements.Modal.question({
        template: "authorized",
        data: {
          isMultiSig: true,
          multiSigMsg: TAPi18n.__("wallet.account.multiSig.approve"),
          range: range,
          callback: ({ signProvider, proposer }) => {
            EthElements.Modal.hide();
            push_transaction(
              type,
              data.proposer,
              data.proposal_name,
              proposer,
              signProvider
            );
          }
        }
      });
    }

    function push_transaction(type, proposer, proposal, from, signProvider) {
      if (type === "approve")
        Helpers.approveProposal(
          proposer,
          proposal,
          from,
          signProvider,
          tr => {
            reactive_force_refresh.set(!reactive_force_refresh.get());
            GlobalNotification.success({
              content: "i18n:wallet.send.transactionSent",
              duration: 20,
              ok: function() {
                window.open(`${transactionMonitor}/${tr.transaction_id}`);
                return true;
              },
              okText: `TX#${tr.transaction_id.substr(0, 6)}..`
            });
          },
          err => {
            reactive_force_refresh.set(!reactive_force_refresh.get());
            EthElements.Modal.hide();
            if (err.message) {
              GlobalNotification.error({
                content: err.message,
                duration: 20
              });
            } else {
              let error = JSON.parse(err);
              GlobalNotification.error({
                content: Helpers.translateExternalErrorMessage(error.error),
                duration: 20
              });
            }
          }
        );
      else if (type === "revoke")
        Helpers.unapproveProposal(
          proposer,
          proposal,
          from,
          signProvider,
          tr => {
            reactive_force_refresh.set(!reactive_force_refresh.get());
            GlobalNotification.success({
              content: "i18n:wallet.send.transactionSent",
              duration: 20,
              ok: function() {
                window.open(`${transactionMonitor}/${tr.transaction_id}`);
                return true;
              },
              okText: `TX#${tr.transaction_id.substr(0, 6)}..`
            });
          },
          err => {
            reactive_force_refresh.set(!reactive_force_refresh.get());
            EthElements.Modal.hide();
            if (err.message) {
              GlobalNotification.error({
                content: err.message,
                duration: 20
              });
            } else {
              let error = JSON.parse(err);
              GlobalNotification.error({
                content: Helpers.translateExternalErrorMessage(error.error),
                duration: 20
              });
            }
          }
        );
    }
  }
});
