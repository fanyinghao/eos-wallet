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
Template.elements_proposal_table.onRendered(function() {
  let self = this;
  self.reactive_accounts = Blaze.currentView.parentView.templateInstance().reactiveVar;

  Tracker.autorun(function() {
    let accounts = self.reactive_accounts.get();
    let proposals = [];
    let approvals = {};
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
    Array.prototype.forEach.call(Object.keys(account_names), name => {
      Helpers.getLatestProposals(name).then(res => {
        proposals = proposals.concat(res);
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
    return proposals;
  },
  hasItems: function() {
    let proposals = reactive_proposals.get();
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
  done: function() {
    let actor = this.action_trace.act.data.trx.actions[0].authorization[0]
      .actor;
    let permission = this.action_trace.act.data.trx.actions[0].authorization[0]
      .permission;
    let owner = ObservableAccounts.accounts[actor];
    let approvals = reactive_approvals.get();
    let approval =
      approvals[
        `${this.action_trace.act.data.proposer}.${
          this.action_trace.act.data.proposal_name
        }`
      ];
    let threshold;
    if (!approval) return false;

    owner.permissions.forEach(item => {
      if (item.perm_name === permission) {
        threshold = item.required_auth.threshold;
        return;
      }
    });

    return threshold < approval.provided_approvals.length;
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
  "click button.dapp-block-button.approve": function(e) {
    let self = this;
    let action = this.action_trace.act.data.trx.actions[0];

    if (action.name === "transfer") {
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
      EthElements.Modal.question({
        template: "authorized",
        data: {
          isMultiSig: true,
          multiSigMsg: TAPi18n.__("wallet.account.multiSig.approve"),
          range: data.requested.map(item => {
            return item.actor;
          }),
          callback: ({ signProvider, proposer }) => {
            EthElements.Modal.hide();
            push_transaction(
              data.proposer,
              data.proposal_name,
              proposer,
              signProvider
            );
          }
        }
      });
    }

    function push_transaction(proposer, proposal, from, signProvider) {
      Helpers.approveProposal(
        proposer,
        proposal,
        from,
        signProvider,
        tr => {
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
