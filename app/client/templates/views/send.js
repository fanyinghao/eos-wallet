const keystore = require("../../lib/eos/keystore");
Eos = require("eosjs");
/**
Template Controllers

@module Templates
*/

/**
The add user template

@class [template] views_send
@constructor
*/

/**
Translate an external error message into the user's language if possible. Otherwise return
the old error message.

@method translateExternalErrorMessage
*/
var translateExternalErrorMessage = function(message) {
  // 'setTxStatusRejected' occurs in the stack trace of the error message triggered when
  // the user has rejects a transaction in MetaMask. Show a localised error message
  // instead of the stack trace.
  let ret = `[${message.code}] - [${message.name}] - ${message.what}`;
  if (message.details && message.details.length > 0)
    ret += ` - ${message.details[0].message}`;
  return ret;
};

// Set basic variables
Template["views_send"].onCreated(function() {
  var template = this;
  EthElements.Modal.hide();

  // SET THE DEFAULT VARIABLES
  TemplateVar.set("amount", "0");
  TemplateVar.set("sendAll", false);

  if (FlowRouter.getRouteName() === "newaccount") {
    TemplateVar.set("send_type", "newaccount");
  } else {
    TemplateVar.set("send_type", "funds");
  }
});

function reload_from(template) {
  let keys = Object.keys(ObservableAccounts.accounts).sort();
  if (keys.length > 0) {
    let from = FlowRouter.getParam("from");
    if (!from) from = ObservableAccounts.accounts[keys[0]].account_name;
    TemplateVar.setTo('select[name="dapp-select-account"]', "value", from);
    template.$('select[name="dapp-select-account"]').trigger("change");
  }
}

Template.views_send.onRendered(function() {
  var template = this;

  if (FlowRouter.getRouteName() === "newaccount") {
    template.autorun(function(c) {
      var newaccount = FlowRouter.current().queryParams;
      if (newaccount) {
        TemplateVar.set("newaccount", newaccount);
      } else if (!template.data) {
        template.$('input[name="accountName"]').focus();
      }
    });
  }

  Tracker.autorun(c => {
    reload_from(template);
  });
});

Template["views_send"].helpers({
  checked: function(type) {
    return TemplateVar.get("send_type") === type;
  },
  /**
    Get the current selected account

    @method (selectedAccount)
    */
  selectedAccount: function() {
    return TemplateVar.get("selectedAccount");
  },
  isMultiSig: function() {
    let isMultiSig = TemplateVar.get("isMultiSig");
    return isMultiSig;
  },
  selectedBalance: function() {
    let selectedAccount = TemplateVar.get("selectedAccount");
    let empty = { value: "0.0000", symbol: "EOS" };
    if (!selectedAccount) return empty;

    if (!selectedAccount.eosBalance) selectedAccount.eosBalance = empty;

    return selectedAccount.eosBalance;
  },
  inputAmount: function() {
    return TemplateVar.get("amount");
  },
  /**
    Return the currently selected amount

    @method (sendTotal)
    */
  sendTotal: function() {
    if (TemplateVar.get("send_type") === "newaccount") return "0.6745";

    var amount = TemplateVar.get("amount"),
      sendAll = TemplateVar.get("sendAll"),
      selectedAccount =
        ObservableAccounts.accounts[
          TemplateVar.getFrom(".dapp-select-account", "value")
        ];

    if (sendAll && selectedAccount) amount = selectedAccount.eosBalance.value;
    if (!_.isFinite(amount)) return "0";

    return amount;
  },
  proposeContent: function() {
    console.log("res");
    eos
      .abiBinToJson(
        "eosio.msig",
        "proposal",
        "c0f3735b000000000000000000000100a6823403ea3055000000572d3ccdcd01200273d8e5a8a59700000000a8ed32323c200273d8e5a8a597104208574d95afa990d003000000000004454f53000000001b5061792070617274656e65723131313120736f6d65206d6f6e657900"
      )
      .then(
        res => {
          console.log(res);
        },
        err => {
          console.log(err);
        }
      );
  },
  newAccount: function() {
    var newaccount = TemplateVar.get("newaccount");
    return newaccount;
  }
});

Template["views_send"].events({
  /**
    Send all funds

    @event change input.send-all
    */
  "change input.send-all": function(e) {
    TemplateVar.set("sendAll", $(e.currentTarget)[0].checked);
    selectedAccount =
      ObservableAccounts.accounts[
        TemplateVar.getFrom(".dapp-select-account", "value")
      ];

    if (selectedAccount)
      TemplateVar.set("amount", selectedAccount.eosBalance.value);
  },
  /**
    Set the amount while typing

    @event keyup input[name="amount"], change input[name="amount"], input input[name="amount"]
    */
  'keyup input[name="amount"], change input[name="amount"], input input[name="amount"]': function(
    e,
    template
  ) {
    let amount = e.currentTarget.value.replace(/[a-zA-Z]+/g, "");
    if (amount.indexOf(".") == 0) amount = "0" + amount;
    if (amount.indexOf(".") >= 0)
      amount = amount.substring(0, amount.indexOf(".") + 5);
    if (
      amount[amount.length - 1] === "." &&
      amount.indexOf(".") !== amount.length - 1
    )
      amount = amount.substring(0, amount.length - 1);
    e.currentTarget.value = amount;
    TemplateVar.set("amount", amount.replace(",", "") || "0");
  },
  /** 
    Set the memo while typing

    @event keyup keyup textarea[name="memo"], change textarea[name="memo"], input textarea[name="memo"]
    */
  'keyup textarea[name="memo"], change textarea[name="memo"], input textarea[name="memo"]': function(
    e,
    template
  ) {
    TemplateVar.set("memo", e.currentTarget.value);
  },
  /**
    Set the to while typing

    @event keyup keyup input[name="to"], change input[name="to"], input input[name="to"]
    */
  'keyup input[name="to"], change input[name="to"], input input[name="to"]': function(
    e,
    template
  ) {
    if (e.currentTarget.value.length > 12)
      e.currentTarget.value = e.currentTarget.value.substring(0, 12);
    TemplateVar.set("to", e.currentTarget.value);
  },
  /**
    Set the to while typing

    @event keyup keyup input[name="proposer"], change input[name="proposer"], input input[name="proposer"]
    */
  'keyup input[name="proposer"], change input[name="proposer"], input input[name="proposer"]': function(
    e,
    template
  ) {
    if (e.currentTarget.value.length > 12)
      e.currentTarget.value = e.currentTarget.value.substring(0, 12);
    TemplateVar.set("proposer", e.currentTarget.value);
  },
  /**
    Select the current section, based on the radio inputs value.

    @event change input[name="choose-type"]
    */
  'change input[name="choose-type"]': function(e, template) {
    TemplateVar.set("send_type", e.currentTarget.value);
    reload_from(template);
  },
  /**
    Set the to while typing

    @event keyup keyup input[name="proposeName"], change input[name="proposeName"], input input[name="proposeName"]
    */
  'keyup input[name="proposeName"], change input[name="proposeName"], input input[name="proposeName"]': function(
    e,
    template
  ) {
    TemplateVar.set("proposeName", e.currentTarget.value);
  },
  /**
    Set the to while typing

    @event keyup keyup input[name="accountName"], change input[name="accountName"], input input[name="accountName"]
    */
  'keyup input[name="accountName"], change input[name="accountName"], input input[name="accountName"]': function(
    e,
    template
  ) {
    TemplateVar.set("accountName", e.currentTarget.value);
  },
  /**
    Set the to while typing

    @event keyup keyup input[name="publicKey"], change input[name="publicKey"], input input[name="publicKey"]
    */
  'keyup input[name="active_publicKey"], change input[name="active_publicKey"], input input[name="active_publicKey"]': function(
    e,
    template
  ) {
    TemplateVar.set("active_publicKey", e.currentTarget.value);
  },
  /**
    Set the to while typing

    @event keyup keyup input[name="publicKey"], change input[name="publicKey"], input input[name="publicKey"]
    */
  'keyup input[name="owner_publicKey"], change input[name="owner_publicKey"], input input[name="owner_publicKey"]': function(
    e,
    template
  ) {
    TemplateVar.set("owner_publicKey", e.currentTarget.value);
  },
  /**
    

    @event change select[name="dapp-select-account"]
    */
  'change select[name="dapp-select-account"]': function(e) {
    let selectedAccount = ObservableAccounts.accounts[e.currentTarget.value];
    TemplateVar.set("selectedAccount", selectedAccount);
  },
  /**
    Submit the form and send the transaction!

    @event submit form
    */
  "submit form": function(e, template) {
    let send_type = TemplateVar.get("send_type");
    let selectedAccount =
      ObservableAccounts.accounts[
        TemplateVar.getFrom(".dapp-select-account", "value")
      ];
    let isMultiSig = Helpers.isMultiSig(selectedAccount);

    if (selectedAccount && !TemplateVar.get("sending")) {
      if (selectedAccount.eosBalance == 0)
        return GlobalNotification.warning({
          content: "i18n:wallet.send.error.emptyWallet",
          duration: 2
        });

      let permission = "active";
      if (selectedAccount.publicKey) {
        if (selectedAccount.publicKey.owner) {
          permission = "owner";
        }
      }

      var onSuccess = (tr, from) => {
        console.log(tr);
        TemplateVar.set(template, "sending", false);

        if (!from) from = selectedAccount.account_name;
        FlowRouter.go("account", { name: from });
        GlobalNotification.success({
          content: "i18n:wallet.send.transactionSent",
          duration: 20,
          ok: function() {
            window.open(`${transactionMonitor}/${tr.transaction_id}`);
            return true;
          },
          okText: `TX#${tr.transaction_id.substr(0, 6)}..`
        });
      };

      var onError = err => {
        TemplateVar.set(template, "sending", false);

        EthElements.Modal.hide();
        if (err.message) {
          GlobalNotification.error({
            content: err.message,
            duration: 20
          });
        } else {
          let error = JSON.parse(err);
          GlobalNotification.error({
            content: translateExternalErrorMessage(error.error),
            duration: 20
          });
        }
        return;
      };

      // The function to send the transaction
      var sendFunds = function(
        _to,
        _amount,
        _memo,
        signProvider,
        _proposer,
        _permission
      ) {
        // show loading
        TemplateVar.set(template, "sending", true);

        try {
          if (!isMultiSig) {
            const _eos = Eos({
              httpEndpoint: httpEndpoint,
              chainId: chainId,
              signProvider: signProvider,
              verbose: false
            });
            _eos
              .transfer(
                selectedAccount.account_name,
                _to,
                _amount,
                _memo || "transfer",
                {
                  authorization: `${
                    selectedAccount.account_name
                  }@${permission}`,
                  broadcast: true,
                  sign: true
                }
              )
              .then(onSuccess, onError);
          } else {
            const propose_eos = Eos({
              httpEndpoint: httpEndpoint,
              chainId: chainId,
              signProvider: signProvider,
              verbose: false
            });

            let permissions = selectedAccount.multiSig_perm;

            if (!_proposer) throw new Error("i18n:wallet.accounts.noProposer");

            if (!permissions || permissions.length === 0)
              throw new Error("not ready");

            propose_eos.contract("eosio.msig").then(msig => {
              eos
                .transfer(
                  selectedAccount.account_name,
                  _to,
                  _amount,
                  _memo || "transfer",
                  {
                    authorization: `${selectedAccount.account_name}@active`,
                    broadcast: false,
                    sign: false
                  }
                )
                .then(transfer => {
                  transfer.transaction.transaction.max_net_usage_words = 0;
                  transfer.transaction.transaction.expiration = new Date(
                    Date.parse(new Date()) + 1000 * 60 * 60 //60mins
                  );
                  console.log(transfer.transaction.transaction);
                  const proposal_name = `tr${Helpers.randomWord(false, 10)}`;
                  msig
                    .propose(
                      _proposer,
                      proposal_name,
                      permissions,
                      transfer.transaction.transaction,
                      { authorization: `${_proposer}@${_permission}` }
                    )
                    .then(tx => {
                      EthElements.Modal.question(
                        {
                          text: TAPi18n.__("wallet.send.proposeResp", {
                            proposeName: proposal_name
                          }),
                          ok: function() {
                            onSuccess(tx, _proposer);
                          }
                        },
                        {
                          closeable: false
                        }
                      );
                    }, onError);
                });
            });
          }
        } catch (e) {
          Helpers.handleError(e);
        }
      };

      var createAccount = function(_name, _owner, _active, signProvider) {
        // show loading
        TemplateVar.set(template, "sending", true);

        try {
          const _eos = Eos({
            httpEndpoint: httpEndpoint,
            chainId: chainId,
            signProvider: signProvider,
            verbose: false
          });

          _eos
            .transaction(tr => {
              tr.newaccount(
                {
                  creator: selectedAccount.account_name,
                  name: _name,
                  owner: _owner,
                  active: _active
                },
                {
                  authorization: `${selectedAccount.account_name}@${permission}`
                }
              );

              tr.buyram(
                {
                  payer: selectedAccount.account_name,
                  receiver: _name,
                  quant: "0.6295 EOS"
                },
                {
                  authorization: `${selectedAccount.account_name}@${permission}`
                }
              );

              tr.delegatebw(
                {
                  from: selectedAccount.account_name,
                  receiver: _name,
                  stake_net_quantity: "0.0050 EOS",
                  stake_cpu_quantity: "0.0400 EOS",
                  transfer: 0
                },
                {
                  authorization: `${selectedAccount.account_name}@${permission}`
                }
              );
            })
            .then(onSuccess, onError);
        } catch (e) {
          Helpers.handleError(e);
        }
      };

      var approveProposal = function(_proposer, _name, signProvider) {
        // show loading
        TemplateVar.set(template, "sending", true);

        try {
          const _eos_app = Eos({
            httpEndpoint: httpEndpoint,
            chainId: chainId,
            signProvider: signProvider,
            verbose: false
          });

          _eos_app.contract("eosio.msig").then(msig => {
            msig
              .approve(
                _proposer,
                _name,
                {
                  actor: selectedAccount.account_name,
                  permission: permission
                },
                {
                  broadcast: true,
                  authorization: `${selectedAccount.account_name}@${permission}`
                }
              )
              .then(tx => {
                msig
                  .exec(_proposer, _name, selectedAccount.account_name, {
                    broadcast: true,
                    authorization: `${
                      selectedAccount.account_name
                    }@${permission}`
                  })
                  .then(
                    exec_tx => {
                      onSuccess(exec_tx);
                    },
                    () => {
                      onSuccess(tx);
                    }
                  );
              }, onError);
          });
        } catch (e) {
          Helpers.handleError(e);
        }
      };

      if (send_type === "funds") {
        var amount = TemplateVar.get("amount") || "0",
          to = TemplateVar.get("to"),
          memo = TemplateVar.get("memo"),
          sendAll = TemplateVar.get("sendAll");

        if (!to)
          return GlobalNotification.warning({
            content: "i18n:wallet.send.error.noReceiver",
            duration: 2
          });

        if (sendAll) amount = selectedAccount.eosBalance.value;

        if (_.isEmpty(amount) || amount === "0" || !_.isFinite(amount))
          return GlobalNotification.warning({
            content: "i18n:wallet.send.error.noAmount",
            duration: 2
          });

        if (
          new BigNumber(amount, 10).gt(
            new BigNumber(selectedAccount.eosBalance.value, 10)
          )
        )
          return GlobalNotification.warning({
            content: "i18n:wallet.send.error.notEnoughFunds",
            duration: 2
          });

        amount =
          amount > 0
            ? `${parseFloat(amount).toFixed(4)} EOS`
            : `${parseFloat(0).toFixed(4)} EOS`;

        EthElements.Modal.question(
          {
            template: "views_modals_sendTransactionInfo",
            data: {
              from: selectedAccount.account_name,
              to: to,
              amount: amount,
              memo: memo
            },
            ok: () => {
              EthElements.Modal.question({
                template: "authorized",
                data: {
                  title: new Spacebars.SafeString(
                    TAPi18n.__("wallet.send.tradeRam.authtitle", {
                      name: selectedAccount.account_name
                    })
                  ),
                  account_name: selectedAccount.account_name,
                  isMultiSig: isMultiSig,
                  permission: isMultiSig ? "" : permission,
                  callback: ({ signProvider, proposer, permission }) => {
                    sendFunds(
                      to,
                      amount,
                      memo,
                      signProvider,
                      proposer,
                      permission
                    );
                  }
                }
              });
            },
            cancel: true
          },
          {
            class: "send-transaction-info"
          }
        );
      } else if (send_type === "newaccount") {
        let newaccount = TemplateVar.get("newaccount");
        let accountName =
          TemplateVar.get("accountName") || newaccount.accountName;
        let active_publicKey =
          TemplateVar.get("active_publicKey") || newaccount.active;
        let owner_publicKey =
          TemplateVar.get("owner_publicKey") || newaccount.owner;

        if (!accountName)
          return GlobalNotification.warning({
            content: "i18n:wallet.send.error.noAccountName",
            duration: 2
          });

        if (!active_publicKey || !owner_publicKey)
          return GlobalNotification.warning({
            content: "i18n:wallet.send.error.noPublicKey",
            duration: 2
          });

        EthElements.Modal.question({
          template: "authorized",
          data: {
            title: new Spacebars.SafeString(
              TAPi18n.__("wallet.send.tradeRam.authtitle", {
                name: selectedAccount.account_name
              })
            ),
            account_name: selectedAccount.account_name,
            isMultiSig: isMultiSig,
            permission: permission,
            callback: ({ signProvider, proposer }) => {
              createAccount(
                accountName,
                owner_publicKey,
                active_publicKey,
                signProvider
              );
            }
          }
        });
      } else if (send_type === "propose") {
        let proposer = TemplateVar.get("proposer");
        let proposeName = TemplateVar.get("proposeName");

        if (!proposer)
          return GlobalNotification.warning({
            content: "i18n:wallet.send.error.noProposer",
            duration: 2
          });
        if (!proposeName)
          return GlobalNotification.warning({
            content: "i18n:wallet.send.error.noProposeName",
            duration: 2
          });

        EthElements.Modal.question({
          template: "authorized",
          data: {
            title: new Spacebars.SafeString(
              TAPi18n.__("wallet.send.tradeRam.authtitle", {
                name: selectedAccount.account_name
              })
            ),
            account_name: selectedAccount.account_name,
            isMultiSig: isMultiSig,
            permission: permission,
            callback: ({ signProvider }) => {
              approveProposal(proposer, proposeName, signProvider);
            }
          }
        });
      }
    }
  }
});
