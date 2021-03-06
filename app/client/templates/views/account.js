const keystore = require("../../lib/eos/keystore");
/**
Template Controllers

@module Templates
*/

var _reactive_refresh = new ReactiveVar(true);

Template.views_account.onRendered(function() {
  const tpl = Template.instance();
  let self = this;
  self.reactive_refresh = _reactive_refresh;

  self.reactive_proposer = new ReactiveVar({});
  self.reactive_refreshed_done = new ReactiveVar(false);

  TemplateVar.set(self, "showPermissions", false);

  Tracker.autorun(function() {
    if (FlowRouter.getRouteName() !== "account") return;

    let isRefresh = self.reactive_refresh.get();

    let name = FlowRouter.getParam("name");
    let account = {
      account_name: name
    };
    TemplateVar.set(tpl, "account_name", name);
    ObservableAccounts.refresh(account).then(
      _account => {
        TemplateVar.set(tpl, "account", _account);
        if (_account.eosBalance)
          TemplateVar.set(tpl, "balance", _account.eosBalance.value);
        else TemplateVar.set(tpl, "balance", "");

        self.reactive_refreshed_done = new ReactiveVar(true);

        let proposers = {};
        _account.multiSig_perm.forEach(item => {
          proposers[item.actor] = "";
        });

        self.reactive_proposer = new ReactiveVar(proposers);
      },
      err => {
        FlowRouter.go("/notfound");
      }
    );
  });
});

function forceRefresh() {
  _reactive_refresh.set(!_reactive_refresh.get());
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
    if (!balance || balance.length === 0) balance = "0.0000";
    return balance;
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
    let account_name = TemplateVar.get("account_name");
    if (Helpers.isMultiSig(this)) {
      return GlobalNotification.warning({
        content: "i18n:wallet.authMultiSig.functionnotavailable",
        duration: 5
      });
    }
    EthElements.Modal.show(
      {
        template: "tradeRam",
        data: {
          account: this,
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
          account: this,
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
          delete ObservableAccounts.accounts[account_name];
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
      data: {
        requirePrivateKey: true,
        account_name: account_name,
        callback: ({ privateKey }) => {
          EthElements.Modal.show(
            {
              template: "jsonView",
              data: {
                json: JSON.stringify(privateKey)
                  .replace(/\n[\s| | ]*\r/g, "\n")
                  .replace(/[\r\n]/g, "")
                  .trim(),
                options: { collapsed: false }
              },
              ok: () => {}
            },
            {
              closeable: true,
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
