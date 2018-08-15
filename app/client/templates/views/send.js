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
Get the data field of either the byte or source code textarea, depending on the selectedType

@method getDataField
*/
var getDataField = function() {
  return TemplateVar.getFrom(".compile-contract", "txData");
};

/**
Translate an external error message into the user's language if possible. Otherwise return
the old error message.

@method translateExternalErrorMessage
*/
var translateExternalErrorMessage = function(message) {
  // 'setTxStatusRejected' occurs in the stack trace of the error message triggered when
  // the user has rejects a transaction in MetaMask. Show a localised error message
  // instead of the stack trace.
  return `[${message.code}] - ${message.name} - ${message.what}`
};

// Set basic variables
Template["views_send"].onCreated(function() {
  var template = this;

  let keys = Object.keys(ObservableAccounts.accounts);
  if (keys.length > 0)
    ObservableAccounts.accounts[keys[0]].selected = "selected";

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

  // ->> GAS PRICE ESTIMATION
  template.autorun(function(c) {
    var address = TemplateVar.getFrom(
        ".dapp-select-account.send-from",
        "value"
      ),
      to = TemplateVar.getFrom(".dapp-address-input .to", "value"),
      amount = TemplateVar.get("amount") || "0",
      data = getDataField(),
      tokenAddress = TemplateVar.get("selectedToken");

    // if(_.isString(address))
    //     address = address.toLowerCase();

    // Ether tx estimation
    if (tokenAddress === "ether") {
      if (EthAccounts.findOne({ address: address }, { reactive: false })) {
        web3.eth.estimateGas(
          {
            from: address,
            to: to,
            value: amount,
            data: data,
            gas: defaultEstimateGas
          },
          estimationCallback.bind(template)
        );

        // Wallet tx estimation
      } else if (
        (wallet = Wallets.findOne({ address: address }, { reactive: false }))
      ) {
        if (contracts["ct_" + wallet._id])
          contracts["ct_" + wallet._id].methods
            .execute(to || "", amount || "", data || "0x00")
            .estimateGas(
              {
                from: wallet.owners[0],
                gas: defaultEstimateGas
              },
              estimationCallback.bind(template)
            );
      }

      // Custom coin estimation
    } else {
      TokenContract.options.address = tokenAddress;
      TokenContract.methods.transfer(to, amount).estimateGas(
        {
          from: address,
          gas: defaultEstimateGas
        },
        estimationCallback.bind(template)
      );
    }
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
  /**
    Returns the decimals of the current token

    @method (tokenDecimals)
    */
  tokenDecimals: function() {
    var token = Tokens.findOne({ address: TemplateVar.get("selectedToken") });
    return token ? token.decimals : 0;
  },
  /**
    Returns the right time text for the "sendText".

    @method (timeText)
    */
  timeText: function() {
    return TAPi18n.__(
      "wallet.send.texts.timeTexts." +
        (
          (Number(
            TemplateVar.getFrom(".dapp-select-gas-price", "feeMultiplicator")
          ) +
            5) /
          2
        ).toFixed(0)
    );
  },
  /**

    Shows correct explanation for token type

    @method (sendExplanation)
    */
  sendExplanation: function() {
    var amount = TemplateVar.get("amount") || "0",
      selectedAccount =
        ObservableAccounts.accounts[
          TemplateVar.getFrom(".dapp-select-account.send-from", "value")
        ];

    if (!token || !selectedAccount) return;

    return Spacebars.SafeString(
      TAPi18n.__("wallet.send.texts.sendToken", {
        amount: Helpers.formatNumberByDecimals(amount, token.decimals),
        name: token.name,
        symbol: token.symbol
      })
    );
  },
  /**
    Get Balance of a token

    @method (formattedCoinBalance)
    */
  formattedCoinBalance: function(e) {
    var selectedAccount =
      ObservableAccounts.accounts[
        TemplateVar.getFrom(".dapp-select-account.send-from", "value")
      ];

    return this.balances && Number(this.balances[selectedAccount._id]) > 0
      ? Helpers.formatNumberByDecimals(
          this.balances[selectedAccount._id],
          this.decimals
        ) +
          " " +
          this.symbol
      : false;
  },
  /**
    Checks if the current selected account is a wallet contract

    @method (selectedAccountIsWalletContract)
    */
  selectedAccountIsWalletContract: function() {
    var selectedAccount =
      ObservableAccounts.accounts[
        TemplateVar.getFrom(".dapp-select-account.send-from", "value")
      ];
    return selectedAccount ? !!selectedAccount.owners : false;
  },
  /**
    Clear amount from characters

    @method (clearAmountFromChars)
    */
  clearAmountFromChars: function(amount) {
    amount = ~amount.indexOf(".") ? amount.replace(/\,/g, "") : amount;

    return amount.replace(/ /g, "");
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
    Select a token

    @event click .token-ether
    */
  "click .token-ether": function(e, template) {
    TemplateVar.set("selectedToken", "ether");

    // trigger amount box change
    template.$('input[name="amount"]').trigger("change");
  },
  /**
    Select a token

    @event click .select-token
    */
  "click .select-token input": function(e, template) {
    var value = e.currentTarget.value;
    TemplateVar.set("selectedToken", value);

    if (value === "ether")
      TemplateVar.setTo(".dapp-data-textarea", "value", "");

    // trigger amount box change
    template.$('input[name="amount"]').trigger("change");
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
    Set the amount while typing

    @event keyup keyup textarea[name="memo"], change textarea[name="memo"], input textarea[name="memo"]
    */
  'keyup textarea[name="memo"], change textarea[name="memo"], input textarea[name="memo"]': function(
    e,
    template
  ) {
    TemplateVar.set("memo", e.currentTarget.value);
  },
  /**
    Set the amount while typing

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
    Submit the form and send the transaction!

    @event submit form
    */
  "submit form": function(e, template) {
    var amount = TemplateVar.get("amount") || "0",
      to = TemplateVar.get("to"),
      selectedAccount =
        ObservableAccounts.accounts[
          TemplateVar.getFrom(".dapp-select-account.send-from", "value")
        ],
      memo = TemplateVar.get("memo"),
      password = TemplateVar.get("password"),
      sendAll = TemplateVar.get("sendAll");
    
    if (selectedAccount && !TemplateVar.get("sending")) {
      if (selectedAccount.eosBalance === "0")
        return GlobalNotification.warning({
          content: "i18n:wallet.send.error.emptyWallet",
          duration: 2
        });

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

      if (!password || password.length === 0)
        return GlobalNotification.warning({
          content: "i18n:wallet.accounts.wrongPassword",
          duration: 2
        });

      amount =
        amount > 0
          ? `${parseFloat(amount).toFixed(4)} EOS`
          : `${parseFloat(0).toFixed(4)} EOS`;

      // The function to send the transaction
      var sendTransaction = function() {
        // show loading
        TemplateVar.set(template, "sending", true);

        try {
          let provider = keystore.SignProvider(selectedAccount.name, password);
          // let _eos = Object.assign(eos, { keyProvider: provider });
          const _eos = Eos({
            httpEndpoint: httpEndpoint,
            chainId: chain.testnet,
            signProvider: provider,
            verbose: false
          });
          _eos.transfer(selectedAccount.name, to, amount, memo || "transfer", true).then(
            tr => {
              assert.equal(tr.transaction.signatures.length, 1);
              assert.equal(typeof tr.transaction.signatures[0], "string");
              console.log(tr);
              TemplateVar.set(template, "sending", false);
              FlowRouter.go("dashboard");
              GlobalNotification.success({
                content: "i18n:wallet.send.transactionSent",
                duration: 2
              });
            },
            err => {
              TemplateVar.set(template, "sending", false);

              EthElements.Modal.hide();
              GlobalNotification.error({
                content: translateExternalErrorMessage(JSON.parse(err).error),
                duration: 20
              });
              return;
            }
          );
        } catch (e) {
          console.log(e);
          TemplateVar.set(template, "sending", false);
          if (e.message === "wrong password" || e.message === "gcm: tag doesn't match") {
            GlobalNotification.warning({
              content: "i18n:wallet.accounts.wrongPassword",
              duration: 2
            });
            return;
          }
        }
      };
      EthElements.Modal.question(
        {
          template: "views_modals_sendTransactionInfo",
          data: {
            from: selectedAccount.name,
            to: to,
            amount: amount,
            memo: memo
          },
          ok: sendTransaction,
          cancel: true
        },
        {
          class: "send-transaction-info"
        }
      );
    }
  }
});
