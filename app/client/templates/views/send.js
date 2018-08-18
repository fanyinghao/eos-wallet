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
  return `[${message.code}] - ${message.name} - ${message.what}`;
};

// Set basic variables
Template["views_send"].onCreated(function() {
  var template = this;

  let keys = Object.keys(ObservableAccounts.accounts);
  if (keys.length > 0)
    ObservableAccounts.accounts[keys[0]].selected = "selected";

  TemplateVar.set("send_type", "funds");

  // SET THE DEFAULT VARIABLES
  TemplateVar.set("amount", "0");
  TemplateVar.set("sendAll", false);

  // Deploy contract
  if (FlowRouter.getRouteName() === "deployContract") {
    TemplateVar.set("selectedAction", "deploy-contract");
    TemplateVar.set("selectedToken", "ether");

    // Send funds
  } else {
    TemplateVar.set("selectedAction", "send-funds");
    TemplateVar.set("selectedToken", FlowRouter.getParam("token") || "ether");
  }

  // check if we are still on the correct chain
  Helpers.checkChain(function(error) {
    if (error && EthAccounts.find().count() > 0) {
      checkForOriginalWallet();
    }
  });

  // check daily limit again, when the account was switched
  template.autorun(function(c) {
    var address = TemplateVar.getFrom(
        ".dapp-select-account.send-from",
        "value"
      ),
      amount = TemplateVar.get("amount") || "0";
  });

  // change the amount when the currency unit is changed
  template.autorun(function(c) {
    var unit = EthTools.getUnit();

    if (!c.firstRun && TemplateVar.get("selectedToken") === "ether") {
      TemplateVar.set(
        "amount",
        EthTools.toWei(
          template.find('input[name="amount"]').value.replace(",", "."),
          unit
        )
      );
    }
  });
});

Template["views_send"].onRendered(function() {
  var template = this;

  // focus address input field
  if (FlowRouter.getParam("address")) {
    this.find('input[name="to"]').value = FlowRouter.getParam("address");
    this.$('input[name="to"]').trigger("input");
  } else if (!this.data) {
    this.$('input[name="to"]').focus();
  }

  // set the from
  var from = FlowRouter.getParam("from");
  if (from)
    TemplateVar.setTo(
      'select[name="dapp-select-account"].send-from',
      "value",
      FlowRouter.getParam("from")
    );

  // initialize send view correctly when directly switching from deploy view
  template.autorun(function(c) {
    if (FlowRouter.getRouteName() === "send") {
      TemplateVar.set("selectedAction", "send");
      TemplateVar.setTo(".dapp-data-textarea", "value", "");
    }
  });

  // change the token type when the account is changed
  var selectedAddress;
  template.autorun(function(c) {
    address = TemplateVar.getFrom(".dapp-select-account.send-from", "value");

    if (c.firstRun) {
      selectedAddress = address;
      return;
    }

    if (selectedAddress !== address) {
      TemplateVar.set("selectedToken", "ether");
    }

    selectedAddress = address;
  });
});

Template["views_send"].helpers({
  /**
    Get the current selected account

    @method (selectedAccount)
    */
  selectedAccount: function() {
    return ObservableAccounts.accounts[
      TemplateVar.getFrom(".dapp-select-account.send-from", "value")
    ];
  },
  isMultiSig: function() {
    let isMultiSig = TemplateVar.get("isMultiSig");
    return isMultiSig;
  },
  selectedBalance: function() {
    selectedAccount =
      ObservableAccounts.accounts[
        TemplateVar.getFrom(".dapp-select-account.send-from", "value")
      ];
    if (selectedAccount) return selectedAccount.eosBalance;
    return 0;
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
          TemplateVar.getFrom(".dapp-select-account.send-from", "value")
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
  proposers: function() {
    let permissions = Object.values(TemplateVar.get("permissions"));
    // if (permissions && permissions.length > 0){
    //   permissions[0].selected = "selected";

    // }
    return permissions;
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
        TemplateVar.getFrom(".dapp-select-account.send-from", "value")
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
    Set the password

    @event keyup keyup input[name="password"], change input[name="password"], input input[name="password"]
    */
  'keyup input[name="password"], change input[name="password"], input input[name="password"]': function(
    e,
    template
  ) {
    TemplateVar.set("password", e.currentTarget.value);
  },
  /**
    Select the current section, based on the radio inputs value.

    @event change input[type="radio"]
    */
  'change input[type="radio"]': function(e) {
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
  'keyup input[name="publicKey"], change input[name="publicKey"], input input[name="publicKey"]': function(
    e,
    template
  ) {
    TemplateVar.set("publicKey", e.currentTarget.value);
  },
  'change select[name="dapp-select-account"].send-from': function(e, template) {
    let selectedAccount = ObservableAccounts.accounts[e.target.value];
    let isMultiSig = false;
    let permissionCount = 0;

    let permissions = [];
    TemplateVar.set(template, "permissions", permissions);

    selectedAccount &&
      selectedAccount.permissions &&
      selectedAccount.permissions.map(item => {
        if (item.perm_name === "active") {
          isMultiSig = item.required_auth.threshold > 1;
          permissionCount = item.required_auth.keys.length;
          TemplateVar.set("isMultiSig", isMultiSig);
          TemplateVar.set("permissionCount", permissionCount);

          if (isMultiSig) {
            item.required_auth.keys.map(obj => {
              eos.getKeyAccounts(obj.key).then(accounts => {
                if (
                  accounts.account_names &&
                  accounts.account_names.length > 0
                ) {
                  for (let i = 0; i < accounts.account_names.length; i++) {
                    let name = accounts.account_names[i];
                    permissions[name] = {
                      name: name,
                      actor: name,
                      permission: "active"
                    };
                    if (i === 0) permissions[name].selected = "selected";
                  }
                  TemplateVar.set(template, "permissions", permissions);
                }
              });
            });
          }
        }
      });
  },
  /**
    Submit the form and send the transaction!

    @event submit form
    */
  "submit form": function(e, template) {
    let send_type = TemplateVar.get("send_type");
    let selectedAccount =
      ObservableAccounts.accounts[
        TemplateVar.getFrom(".dapp-select-account.send-from", "value")
      ];
    let selectedProposer = TemplateVar.getFrom(
      ".dapp-select-account.send-proposer",
      "value"
    );
    let password = TemplateVar.get("password");

    let provider = keystore.SignProvider(selectedAccount.name, password);
    const _eos = Eos({
      httpEndpoint: httpEndpoint,
      chainId: chainId,
      signProvider: provider,
      verbose: false
    });

    if (selectedAccount && !TemplateVar.get("sending")) {
      if (selectedAccount.eosBalance == 0)
        return GlobalNotification.warning({
          content: "i18n:wallet.send.error.emptyWallet",
          duration: 2
        });

      if (!password || password.length === 0)
        return GlobalNotification.warning({
          content: "i18n:wallet.accounts.wrongPassword",
          duration: 2
        });

      var onSuccess = tr => {
        console.log(tr);
        TemplateVar.set(template, "sending", false);
        FlowRouter.go("dashboard");
        GlobalNotification.success({
          content: "i18n:wallet.send.transactionSent",
          duration: 20,
          ok: function() {
            window.open(
              `https://tools.cryptokylin.io/#/tx/${tr.transaction_id}`
            );
            return true;
          },
          okText: TAPi18n.__("wallet.accounts.buttons.viewOnExplorer")
        });
      };

      var onError = err => {
        TemplateVar.set(template, "sending", false);

        EthElements.Modal.hide();
        GlobalNotification.error({
          content: translateExternalErrorMessage(JSON.parse(err).error),
          duration: 20
        });
        return;
      };

      function randomWord(randomFlag, min, max) {
        var str = "",
          range = min,
          arr = [
            "a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"
          ];

        // 随机产生
        if (randomFlag) {
          range = Math.round(Math.random() * (max - min)) + min;
        }
        for (var i = 0; i < range; i++) {
          pos = Math.round(Math.random() * (arr.length - 1));
          str += arr[pos];
        }
        return str;
      }

      // The function to send the transaction
      var sendTransaction = async function(_to, _amount, _memo, _proposer) {
        // show loading
        TemplateVar.set(template, "sending", true);

        try {
          let isMultiSig = TemplateVar.get(template, "isMultiSig");
          let permissions = [];
          let permissionCount = 0;

          if (!isMultiSig) {
            _eos
              .transfer(
                selectedAccount.name,
                _to,
                _amount,
                _memo || "transfer",
                true
              )
              .then(onSuccess, onError);
          } else {
            permissions = Object.values(
              TemplateVar.get(template, "permissions")
            );
            permissionCount = TemplateVar.get(template, "permissionCount");

            if (!selectedProposer)
              throw new Error("i18n:wallet.accounts.noProposer");

            if (!permissions || permissions.length === 0)
              throw new Error("not ready");

            _eos.contract("eosio.msig").then(msig => {
              _eos
                .transfer(
                  selectedAccount.name,
                  _to,
                  _amount,
                  _memo || "transfer",
                  { broadcast: false, sign: false }
                )
                .then(transfer => {
                  transfer.transaction.transaction.max_net_usage_words = 0;
                  transfer.transaction.transaction.expiration = new Date(
                    Date.parse(new Date()) + 1000 * 60 * 60 //60mins
                  );
                  console.log(transfer.transaction.transaction);

                  msig
                    .propose(
                      _proposer,
                      `tr${randomWord(false, 10)}`,
                      permissions,
                      transfer.transaction.transaction
                    )
                    .then(onSuccess, onError);
                });
            });
          }
        } catch (e) {
          console.log(e);
          TemplateVar.set(template, "sending", false);
          if (
            e.message === "wrong password" ||
            e.message === "gcm: tag doesn't match"
          ) {
            GlobalNotification.warning({
              content: "i18n:wallet.accounts.wrongPassword",
              duration: 2
            });
            return;
          } else {
            GlobalNotification.warning({
              content: e.message,
              duration: 2
            });
            return;
          }
        }
      };

      var createAccount = function(_name, _owner, _active) {
        // show loading
        TemplateVar.set(template, "sending", true);

        _eos
          .transaction(tr => {
            tr.newaccount({
              creator: selectedAccount.name,
              name: _name,
              owner: _owner,
              active: _active
            });

            tr.buyram({
              payer: selectedAccount.name,
              receiver: _name,
              quant: "0.6295 EOS"
            });

            tr.delegatebw({
              from: selectedAccount.name,
              receiver: _name,
              stake_net_quantity: "0.0050 EOS",
              stake_cpu_quantity: "0.0400 EOS",
              transfer: 0
            });
          })
          .then(onSuccess, onError);
      };

      var approveProposal = function(_proposer, _name) {
        // show loading
        TemplateVar.set(template, "sending", true);

        _eos.contract("eosio.msig").then(msig => {
          msig
            .approve(_proposer, _name, {
              actor: selectedAccount.name,
              permission: "active"
            })
            .then(onSuccess, onError);
        });
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
              from: selectedAccount.name,
              to: to,
              amount: amount,
              memo: memo
            },
            ok: () => sendTransaction(to, amount, memo, selectedProposer),
            cancel: true
          },
          {
            class: "send-transaction-info"
          }
        );
      } else if (send_type === "newaccount") {
        let accountName = TemplateVar.get("accountName");
        let publicKey = TemplateVar.get("publicKey");

        createAccount(accountName, publicKey, publicKey);
      } else if (send_type === "propose") {
        let proposer = TemplateVar.get("proposer");
        let proposeName = TemplateVar.get("proposeName");

        approveProposal(proposer, proposeName);
      }
    }
  }
});
