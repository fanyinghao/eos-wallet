const { Api } = require("eosjs");

Template.tradeRam.onRendered(function() {
  this.$('input[name="to"]').focus();
});

Template.tradeRam.events({
  "keyup .amount input": function(e) {
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
    TemplateVar.set(e.target.name, amount.replace(",", "") || "0");
  },
  "keyup .bytes input": function(e) {
    let amount = e.currentTarget.value
      .replace(/[a-zA-Z]+/g, "")
      .replace(".", "");
    e.currentTarget.value = amount;
    TemplateVar.set(e.target.name, amount.replace(",", "") || 0);
  },
  "keyup input[name=to].to": function(e) {
    TemplateVar.set("to", e.target.value);
  },
  "click button": function(e, template) {
    let self = this;
    let account = this.account;
    let from = this.from;
    let to = TemplateVar.get("to") || from;
    let buy_ram = TemplateVar.get("buy_ram");
    let sell_bytes = TemplateVar.get("sell_bytes");
    let permission = "";
    if (account.publicKey.active) {
      permission = "active";
    } else if (account.publicKey.owner) {
      permission = "owner";
    }

    function get_eos(signProvider) {
      const api = new Api({
        rpc: EOS.RPC,
        signatureProvider: signProvider,
        authorityProvider: {
          getRequiredKeys: args => args.availableKeys
        }
      });
      return api;
    }

    var onSuccess = tr => {
      console.log(tr);
      EthElements.Modal.hide();

      TemplateVar.set(template, "sending", false);

      if (self.callback) self.callback();

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
      EthElements.Modal.hide();
      TemplateVar.set(template, "sending", false);

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
      return;
    };

    function toAmount(value) {
      let amount =
        value > 0
          ? `${parseFloat(value).toFixed(4)} EOS`
          : `${parseFloat(0).toFixed(4)} EOS`;
      return amount;
    }

    function buy_ram_tx(signProvider) {
      // show loading
      const _eos = get_eos(signProvider);

      const _auth = [
        {
          actor: from,
          permission: permission
        }
      ];

      try {
        _eos
          .transact(
            {
              actions: [
                {
                  account: "eosio",
                  name: "buyrambytes",
                  authorization: _auth,
                  data: {
                    payer: from,
                    receiver: to,
                    bytes: parseInt(buy_ram) * 1024
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
        handleError(e);
      }
    }

    function sell_ram_tx(signProvider) {
      // show loading
      const _eos = get_eos(signProvider);

      const _auth = [
        {
          actor: from,
          permission: permission
        }
      ];

      try {
        _eos
          .transact(
            {
              actions: [
                {
                  account: "eosio",
                  name: "sellram",
                  authorization: _auth,
                  data: {
                    account: from,
                    bytes: parseInt(sell_bytes) * 1024
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
        handleError(e);
      }
    }

    if (!TemplateVar.get("sending")) {
      TemplateVar.set("sending", true);

      EthElements.Modal.show({
        template: "authorized",
        data: {
          title: new Spacebars.SafeString(
            TAPi18n.__("wallet.send.tradeRam.authtitle", { name: from })
          ),
          account_name: from,
          callback: ({ signProvider }) => {
            if (!TemplateVar.get("sending")) {
              if (e.target.name === "buy_ram") {
                buy_ram_tx(signProvider);
              } else if (e.target.name === "sell_ram") {
                sell_ram_tx(signProvider);
              }
            }
          }
        }
      });
    }
  }
});
