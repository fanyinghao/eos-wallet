const { Api } = require("eosjs");
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
  TemplateVar.set("currentContract", "eosio.token");
  TemplateVar.set("currentSymbol", "EOS");

  if (FlowRouter.getRouteName() === "newaccount") {
    TemplateVar.set("send_type", "newaccount");
  } else {
    TemplateVar.set("send_type", "funds");
  }
});

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
    const type = TemplateVar.get(template, "send_type");
    const selectedAccount = TemplateVar.get(template, "selectedAccount");
    const contract = TemplateVar.get(template, "currentContract");
    const symbol = TemplateVar.get(template, "currentSymbol");
    const token = Helpers.getToken(contract, symbol);

    let selected = TemplateVar.getFrom(".send-from", "value");
    if (!selected && selectedAccount) {
      selected = selectedAccount.account_name;
    }

    if (contract === "add" || !selected || type !== "funds") return;
    EOS.RPC.get_currency_balance(contract, selected, symbol).then(
      resp => {
        if (resp.length > 0) {
          const balance = resp[0];
          const value = balance.split(" ")[0];
          const symbol = balance.split(" ")[1];
          TemplateVar.set(template, "selectedBalance", { value, symbol });
        } else
          TemplateVar.set(template, "selectedBalance", {
            value: parseFloat(0).toFixed(token.precise),
            symbol: token.symbol
          });
      },
      err => {
        console.log(err);
      }
    );
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
    return TemplateVar.get("selectedBalance");
  },
  inputAmount: function() {
    const contract = TemplateVar.get("currentContract");
    const symbol = TemplateVar.get("currentSymbol");
    const token = Helpers.getToken(contract, symbol);
    const amount = TemplateVar.get("amount") || "0";
    return new BigNumber(amount).toFixed(token.precise);
  },
  /**
    Return the currently selected amount

    @method (sendTotal)
    */
  sendTotal: function() {
    const contract = TemplateVar.get("currentContract");
    const symbol = TemplateVar.get("currentSymbol");
    const token = Helpers.getToken(contract, symbol);

    if (TemplateVar.get("send_type") === "newaccount") return "0.6745";

    var amount = TemplateVar.get("amount"),
      sendAll = TemplateVar.get("sendAll"),
      selectedBalance = TemplateVar.get("selectedBalance");

    if (sendAll && selectedBalance) amount = selectedBalance.value;
    if (!_.isFinite(amount)) return parseFloat(0).toFixed(token.precise);

    return new BigNumber(amount).toFixed(token.precise);
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
  },
  toNewAccount: function() {
    return FlowRouter.getRouteName() === "newaccount";
  },
  symbol: function() {
    const symbol = TemplateVar.get("currentSymbol");
    return symbol;
  },
  contract: function() {
    return {
      contract: TemplateVar.get("currentContract"),
      symbol: TemplateVar.get("currentSymbol")
    };
  },
  placeholder: function() {
    const contract = TemplateVar.get("currentContract");
    const symbol = TemplateVar.get("currentSymbol");
    const token = Helpers.getToken(contract, symbol);
    return parseFloat(0).toFixed(token.precise);
  }
});

Template["views_send"].events({
  /**
    Send all funds

    @event change input.send-all
    */
  "change input.send-all": function(e) {
    const select = e.target.form["dapp-select-token"];
    const contract = select.value;
    const symbol = select.options[select.selectedIndex].dataset.symbol;

    TemplateVar.set("currentContract", contract);
    TemplateVar.set("currentSymbol", symbol);

    const token = Helpers.getToken(contract, symbol);
    const checked = $(e.currentTarget)[0].checked;
    TemplateVar.set("sendAll", checked);

    if (checked) {
      const selectedBalance = TemplateVar.get("selectedBalance");
      if (selectedBalance) TemplateVar.set("amount", selectedBalance.value);
    } else {
      TemplateVar.set("amount", parseFloat(0).toFixed(token.precise));
    }
  },
  /**
    Set the amount while typing

    @event keyup input[name="amount"], change input[name="amount"], input input[name="amount"]
    */
  'keydown input[name="amount"],keyup input[name="amount"], change input[name="amount"], input input[name="amount"]': function(
    e,
    template
  ) {
    const select = e.target.form["dapp-select-token"];
    const contract = select.value;
    const symbol = select.options[select.selectedIndex].dataset.symbol;

    TemplateVar.set("currentContract", contract);
    TemplateVar.set("currentSymbol", symbol);
    const token = Helpers.getToken(contract, symbol);
    let amount = e.currentTarget.value;
    if (amount.indexOf(".") !== amount.lastIndexOf("."))
      amount = amount.substring(0, amount.length - 1);
    if (amount.indexOf(".") >= 0)
      amount = amount.substring(0, amount.indexOf(".") + token.precise + 1);
    if (amount.indexOf(".") === amount.length - 1)
      amount = amount.substring(0, amount.length - 1);
    e.currentTarget.value = amount;
    TemplateVar.set("amount", amount);
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
    const type = e.currentTarget.value;
    TemplateVar.set("send_type", e.currentTarget.value);
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
  'change select.send-from[name="dapp-select-account"]': function(e, template) {
    const contract = TemplateVar.get("currentContract");
    const symbol = TemplateVar.get("currentSymbol");
    const token = Helpers.getToken(contract, symbol);
    let selectedAccount = ObservableAccounts.accounts[e.currentTarget.value];
    TemplateVar.set("selectedAccount", selectedAccount);
    TemplateVar.set("selectedBalance", {
      value: parseFloat(0).toFixed(token.precise)
    });
  },
  'change select[name="dapp-select-token"]': function(e, template) {
    const target = e.currentTarget;
    const contract = target.value;
    const symbol = target.options[target.selectedIndex].dataset.symbol;
    TemplateVar.set(template, "currentContract", contract);
    TemplateVar.set(template, "currentSymbol", symbol);
  },
  /**
    Submit the form and send the transaction!

    @event submit form
    */
  "submit form": function(e, template) {
    let send_type = TemplateVar.get("send_type");
    let select_class = "";
    switch (send_type) {
      case "funds":
        select_class = ".send-from";
        break;
      case "propose":
        select_class = ".propose-from";
        break;
      case "newaccount":
        select_class = ".newaccount-from";
        break;
    }

    let selectedAccount =
      ObservableAccounts.accounts[TemplateVar.getFrom(select_class, "value")];
    let isMultiSig = Helpers.isMultiSig(selectedAccount);
    let selectedBalance = TemplateVar.get("selectedBalance");

    if (selectedAccount && !TemplateVar.get("sending")) {
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
      var sendFunds = async function(
        _to,
        _amount,
        _memo,
        signProvider,
        _proposer,
        _permission
      ) {
        // show loading
        TemplateVar.set(template, "sending", true);
        const contract = TemplateVar.get(template, "currentContract");

        try {
          if (!isMultiSig) {
            const api = new Api({
              rpc: EOS.RPC,
              signatureProvider: signProvider
            });
            const _auth = [
              {
                actor: selectedAccount.account_name,
                permission: permission
              }
            ];
            api
              .transact(
                {
                  actions: [
                    {
                      account: contract,
                      name: "transfer",
                      authorization: _auth,
                      data: {
                        from: selectedAccount.account_name,
                        to: _to,
                        quantity: _amount,
                        memo: _memo
                      }
                    }
                  ]
                },
                {
                  blocksBehind: 3,
                  expireSeconds: 30
                }
              )
              .then(onSuccess, onError);
          } else {
            let permissions = selectedAccount.multiSig_perm;

            if (!_proposer) throw new Error("i18n:wallet.accounts.noProposer");

            if (!permissions || permissions.length === 0)
              throw new Error("not ready");

            const api = new Api({
              rpc: EOS.RPC,
              signatureProvider: signProvider,
              authorityProvider: {
                getRequiredKeys: args => args.availableKeys
              }
            });
            const _auth = [
              {
                actor: _proposer,
                permission: _permission
              }
            ];
            const transfer = await api.transact(
              {
                actions: [
                  {
                    account: contract,
                    name: "transfer",
                    authorization: [
                      {
                        actor: selectedAccount.account_name,
                        permission: "active"
                      }
                    ],
                    data: {
                      from: selectedAccount.account_name,
                      to: _to,
                      quantity: _amount,
                      memo: _memo
                    }
                  }
                ]
              },
              {
                blocksBehind: 3,
                expireSeconds: Date.parse(new Date()) + 1000 * 60 * 60, //60mins
                broadcast: false,
                sign: false
              }
            );
            const trx = api.deserializeTransaction(
              transfer.serializedTransaction
            );
            console.log(trx);

            const proposal_name = `tr${Helpers.randomWord(false, 10)}`;
            api
              .transact(
                {
                  actions: [
                    {
                      account: "eosio.msig",
                      name: "propose",
                      authorization: _auth,
                      data: {
                        proposer: _proposer,
                        proposal_name,
                        requested: permissions,
                        trx: trx
                      }
                    }
                  ]
                },
                {
                  blocksBehind: 3,
                  expireSeconds: 30
                }
              )
              .then(tx => {
                EthElements.Modal.question(
                  {
                    text: TAPi18n.__("wallet.send.proposeResp", {
                      proposeName: proposal_name
                    }),
                    ok: function() {
                      onSuccess(tx);
                    }
                  },
                  {
                    closeable: false
                  }
                );
              }, onError);
          }
        } catch (e) {
          Helpers.handleError(e);
        }
      };

      var createAccount = function(_name, _owner, _active, signProvider) {
        // show loading
        TemplateVar.set(template, "sending", true);

        try {
          const api = new Api({
            rpc: EOS.RPC,
            signatureProvider: signProvider
          });
          const _auth = [
            {
              actor: selectedAccount.account_name,
              permission: permission
            }
          ];
          api
            .transact(
              {
                actions: [
                  {
                    account: "eosio",
                    name: "newaccount",
                    authorization: _auth,
                    data: {
                      creator: selectedAccount.account_name,
                      name: _name,
                      owner: {
                        threshold: 1,
                        keys: [
                          {
                            key: _owner,
                            weight: 1
                          }
                        ],
                        accounts: [],
                        waits: []
                      },
                      active: {
                        threshold: 1,
                        keys: [
                          {
                            key: _active,
                            weight: 1
                          }
                        ],
                        accounts: [],
                        waits: []
                      }
                    }
                  },
                  {
                    account: "eosio",
                    name: "buyram",
                    authorization: _auth,
                    data: {
                      payer: selectedAccount.account_name,
                      receiver: _name,
                      quant: "0.6295 EOS"
                    }
                  },
                  {
                    account: "eosio",
                    name: "delegatebw",
                    authorization: _auth,
                    data: {
                      from: selectedAccount.account_name,
                      receiver: _name,
                      stake_net_quantity: "0.0050 EOS",
                      stake_cpu_quantity: "0.0400 EOS",
                      transfer: false
                    }
                  }
                ]
              },
              {
                blocksBehind: 3,
                expireSeconds: 30
              }
            )
            .then(onSuccess, onError);
        } catch (e) {
          Helpers.handleError(e);
        }
      };

      var approveProposal = function(_proposer, _name, signProvider) {
        // show loading
        TemplateVar.set(template, "sending", true);

        try {
          const api = new Api({
            rpc: EOS.RPC,
            signatureProvider: signProvider
          });
          const _auth = {
            actor: selectedAccount.account_name,
            permission: permission
          };

          api
            .transact(
              {
                actions: [
                  {
                    account: "eosio.msig",
                    name: "approve",
                    authorization: [_auth],
                    data: {
                      proposer: _proposer,
                      proposal_name: _name,
                      level: _auth
                    }
                  }
                ]
              },
              {
                blocksBehind: 3,
                expireSeconds: 30
              }
            )
            .then(tx => {
              api
                .transact(
                  {
                    actions: [
                      {
                        account: "eosio.msig",
                        name: "exec",
                        authorization: [_auth],
                        data: {
                          proposer: _proposer,
                          name: _name,
                          executer: selectedAccount.account_name
                        }
                      }
                    ]
                  },
                  {
                    blocksBehind: 3,
                    expireSeconds: 30
                  }
                )
                .then(
                  exec_tx => {
                    onSuccess(exec_tx);
                  },
                  () => {
                    onSuccess(tx);
                  }
                );
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
        const contract = TemplateVar.get("currentContract");
        const symbol = TemplateVar.get("currentSymbol");
        const token = Helpers.getToken(contract, symbol);

        if (!to)
          return GlobalNotification.warning({
            content: "i18n:wallet.send.error.noReceiver",
            duration: 2
          });

        if (sendAll) amount = selectedBalance.value;

        if (
          _.isEmpty(amount) ||
          new BigNumber(amount, 10).eq(0) ||
          !_.isFinite(amount)
        )
          return GlobalNotification.warning({
            content: "i18n:wallet.send.error.noAmount",
            duration: 2
          });

        if (
          new BigNumber(amount, 10).gt(new BigNumber(selectedBalance.value, 10))
        )
          return GlobalNotification.warning({
            content: "i18n:wallet.send.error.notEnoughFunds",
            duration: 2
          });

        amount =
          amount > 0
            ? `${new BigNumber(amount).toFixed(token.precise)} ${token.symbol}`
            : `${parseFloat(0).toFixed(token.precise)} ${token.symbol}`;

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
                  range: isMultiSig
                    ? selectedAccount.multiSig_perm
                        .map(item => {
                          return item.actor;
                        })
                        .filter(item => {
                          return ObservableAccounts.accounts[item];
                        })
                    : [],
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
