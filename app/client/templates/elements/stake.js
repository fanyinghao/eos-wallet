Template.stake.onRendered(function() {
  this.$('input[name="to"]').focus();
});

Template.stake.events({
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
  "keyup input[name=to].to": function(e) {
    TemplateVar.set("to", e.target.value);
  },
  "click button": function(e, template) {
    let self = this;
    let account = this.account;
    let from = this.from;
    let to = TemplateVar.get("to") || from;
    let stake_cpu = TemplateVar.get("stake_cpu");
    let stake_net = TemplateVar.get("stake_net");
    let unstake_cpu = TemplateVar.get("unstake_cpu");
    let unstake_net = TemplateVar.get("unstake_net");
    let permission = "";
    if (account.publicKey.active) {
      permission = "active";
    } else if (account.publicKey.owner) {
      permission = "owner";
    }

    function get_eos(signProvider) {
      const _eos = Eos({
        httpEndpoint: httpEndpoint,
        chainId: chainId,
        signProvider: signProvider,
        verbose: false
      });
      return _eos;
    }

    var onSuccess = tr => {
      console.log(tr);
      EthElements.Modal.hide();
      TemplateVar.set(template, "sending", true);

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
      TemplateVar.set(template, "sending", true);

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

    function stake(signProvider) {
      // show loading
      let _eos = get_eos(signProvider);

      try {
        _eos
          .transaction(tr => {
            tr.delegatebw(
              {
                from: from,
                receiver: to,
                stake_net_quantity: toAmount(stake_net),
                stake_cpu_quantity: toAmount(stake_cpu),
                transfer: 0
              },
              {
                authorization: `${from}@${permission}`
              }
            );
          })
          .then(onSuccess, onError);
      } catch (e) {
        handleError(e);
      }
    }

    function unstake(signProvider) {
      // show loading
      let _eos = get_eos(signProvider);

      try {
        _eos
          .transaction(tr => {
            tr.undelegatebw(
              {
                from: from,
                receiver: to,
                unstake_net_quantity: toAmount(unstake_net),
                unstake_cpu_quantity: toAmount(unstake_cpu),
                transfer: 0
              },
              {
                authorization: `${from}@${permission}`
              }
            );
          })
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
            TAPi18n.__("wallet.send.stake.authtitle", { name: from })
          ),
          account_name: from,
          callback: ({ signProvider }) => {
            if (!TemplateVar.get("sending")) {
              if (e.target.name === "stake") {
                stake(signProvider);
              } else if (e.target.name === "unstake") {
                unstake(signProvider);
              }
            }
          }
        }
      });
    }
  }
});
