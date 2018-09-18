const keystore = require("../../lib/eos/keystore");
/**
Template Controllers

@module Templates
*/

var reactive_refresh = new ReactiveVar(true);

Template.views_account.onRendered(function() {
  let self = this;

  TemplateVar.set(self, "showPermissions", false);

  Tracker.autorun(function() {
    if (FlowRouter.getRouteName() !== "account") return;

    let isRefresh = reactive_refresh.get();

    let name = FlowRouter.getParam("name");
    TemplateVar.set(self, "account_name", name);
    eos.getAccount(name).then(
      account => {
        account.creating = false;
        TemplateVar.set(self, "account", account);

        eos.getCurrencyBalance("eosio.token", name).then(
          res => {
            TemplateVar.set(self, "balance", res);
          },
          err => {
            console.log(err);
          }
        );
      },
      err => {
        FlowRouter.go("/notfound");
      }
    );
  });
});

function forceRefresh() {
  let isRefresh = reactive_refresh.get();
  reactive_refresh.set(!isRefresh);
  TemplateVar.set("refreshTx", !TemplateVar.get("refreshTx"));
}

Template["views_account"].onRendered(function() {});

Template["views_account"].helpers({
  /**
    Get the current selected account

    @method (account)
    */
  account: function() {
    return TemplateVar.get("account");
  },
  isOwner: function() {
    return keystore.Get(this.account_name).encryptedData;
  },
  /**
    Get the tokens balance

    @method (formattedTokenBalance)
    */
  formattedBalance: function(e) {
    var balance = TemplateVar.get("balance");
    if (!balance || balance.length === 0) balance = ["0.0000 EOS"];
    return balance[0];
  },
  refundBalance: function(e) {
    let account = TemplateVar.get("account");
    if (!account.refund_request) return "0.0000 EOS";
    let total =
      Number(account.refund_request.cpu_amount.replace("EOS", "").trim()) +
      Number(account.refund_request.net_amount.replace("EOS", "").trim());
    return total.toFixed(4) + " EOS";
  },
  ramToString: function(e) {
    return (e / 1024).toFixed(3) + " KB";
  },
  progress: function(e, v, a) {
    return ((e / v) * 100).toFixed(a) + "%";
  }
});

Template["views_account"].events({
  /**
    Clicking the delete button will show delete modal

    @event click button.remove-button
    */
  "click button.buy-button": function(e, template) {
    forceRefresh();
    let account_name = TemplateVar.get("account_name");
    EthElements.Modal.show(
      {
        template: "tradeRam",
        data: {
          from: account_name,
          callback: () => {
            forceRefresh();
          }
        }
      },
      {
        class: "modal-small"
      }
    );
  },
  /**
    Clicking the delete button will show delete modal

    @event click button.remove-button
    */
  "click button.stake-button": function(e, template) {
    let account_name = TemplateVar.get("account_name");
    // Open a modal showing the QR Code
    EthElements.Modal.show(
      {
        template: "stake",
        data: {
          from: account_name,
          callback: () => {
            forceRefresh();
          }
        }
      },
      {
        class: "modal-medium"
      }
    );
  },
  /**
    Clicking the delete button will show delete modal

    @event click button.remove-button
    */
  "click button.remove-button": function(e, template) {
    let account_name = TemplateVar.get("account_name");
    EthElements.Modal.show({
      template: "authorized",
      data: {
        title: new Spacebars.SafeString(
          TAPi18n.__("wallet.accounts.modal.deleteText")
        ),
        account_name: account_name,
        callback: () => {
          keystore.Remove(account_name);
          FlowRouter.go("dashboard");
          return true;
        }
      }
    });
  },
  /**
    Click to export private Key

    @event click a.export private Key
    */
  "click button.exportKey-button": function(e) {
    e.preventDefault();
    let account_name = TemplateVar.get("account_name");
    // Open a modal showing the QR Code
    EthElements.Modal.show({
      template: "authorized",
      requirePrivateKey: true,
      data: {
        account_name: account_name,
        callback: (signProvider, privateKey) => {
          EthElements.Modal.hide();
          EthElements.Modal.question(
            {
              text: privateKey,
              ok: () => {}
            },
            {
              closeable: false,
              class: "modal-medium"
            }
          );
        }
      }
    });
  },

  /**
    Authorize of the account

    @event click a.create.account
    */
  "click .authorize-button": function(e) {
    e.preventDefault();
    let account = this;

    let keys = keystore.Get(this.account_name).publicKey;

    if (!keys.owner) {
      return GlobalNotification.warning({
        content: "i18n:wallet.authMultiSig.requireOwner",
        duration: 2
      });
    }

    // Open a modal showing the QR Code
    EthElements.Modal.show(
      {
        template: "views_account_authorize",
        data: {
          account: account,
          callback: () => {
            forceRefresh();
          }
        }
      },
      {
        class: "modal-small"
      }
    );
  },
  "click .account-permissions-link a": (e, template) => {
    e.preventDefault();
    let showPermissions = TemplateVar.get(template, "showPermissions");
    TemplateVar.set(template, "showPermissions", !showPermissions);
  }
});
