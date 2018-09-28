/**
Template Controllers

@module Templates
*/

/**
The account template

@class [template] elements_account
@constructor
*/

Template.elements_account.onRendered(function() {
  const tpl = Template.instance();
  let self = this;

  self.reactiveAccountName = new ReactiveVar(this.data.name);
  self.reactive_proposer = Blaze.currentView.parentView.parentView.parentView.parentView.templateInstance().reactive_proposer;
  self.reactive_refreshed_count = Blaze.currentView.parentView.parentView.parentView.parentView.templateInstance().reactive_refreshed_count;

  Tracker.autorun(() => {
    let name = self.reactiveAccountName.get();
    let account = {
      loading: true,
      account_name: name
    };
    TemplateVar.set(tpl, "account", account);

    ObservableAccounts.refresh(account).then(
      _account => {
        TemplateVar.set(tpl, "account", _account);
        let reactive_accounts = self.reactive_proposer.get();
        if (_account.multiSig_perm.length > 0) {
          Array.prototype.forEach.call(_account.multiSig_perm, acc => {
            reactive_accounts[acc.actor] = "";
          });
          self.reactive_proposer.set(reactive_accounts);

          if (Helpers.getActiveKeys(_account).length > 0) {
            GlobalNotification.warning({
              title: _account.account_name,
              content: "i18n:wallet.authMultiSig.disallowkey",
              duration: 5
            });
          }
        }
        self.reactive_refreshed_count.set(
          self.reactive_refreshed_count.get() + 1
        );
      },
      err => {
        console.error(err);
      }
    );
  });
});

Template.elements_account.rendered = function() {
  // initiate the geo pattern
  var pattern = GeoPattern.generate(this.data.name);
  this.$(".account-pattern").css("background-image", pattern.toDataUrl());
};

Template.elements_account.helpers({
  /**
    Get the current account

    @method (account)
    */
  account: function() {
    const tpl = Template.instance();
    let account = TemplateVar.get("account");
    if (
      tpl.reactiveAccountName &&
      tpl.data.name !== tpl.reactiveAccountName.get()
    ) {
      tpl.reactiveAccountName.set(tpl.data.name);
      return;
    }
    return account;
  },
  /**
    Get the tokens balance

    @method (formattedTokenBalance)
    */
  formattedTokenBalance: function(e) {
    const tpl = Template.instance();
    let account = TemplateVar.get("account");
    if (
      tpl.reactiveAccountName &&
      tpl.data.name !== tpl.reactiveAccountName.get()
    ) {
      tpl.reactiveAccountName.set(tpl.data.name);
      return;
    }
    if (!account || !account.eosBalance) return ["0.0000 EOS"];
    return `${account.eosBalance.value} ${account.eosBalance.symbol}`;
  },
  /**
    Account was just added. Return true and remove the "new" field.

    @method (new)
    */
  new: function() {
    return false;
  }
});

Template["elements_account"].events({
  "click .creating": function(e) {
    console.log("click");
    e.preventDefault();
    let nodes = e.currentTarget
      .querySelector(".account-id")
      .querySelectorAll(".hide");
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].style.display = "block";
    }
    Helpers.copyAddress(e.currentTarget.querySelector(".account-id"));
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].style.display = "none";
    }
    FlowRouter.go("newaccount", null, {
      accountName: this.account_name,
      owner: this.publicKey.owner,
      active: this.publicKey.active
    });
  }
});
