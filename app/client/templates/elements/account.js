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
  let self = this;
  self.reactiveAccountName = new ReactiveVar(this.data.name);
  self.reactive_accounts = Blaze.currentView.parentView.parentView.parentView.parentView.templateInstance().reactiveVar;

  Tracker.autorun(() => {
    let name = self.reactiveAccountName.get();
    let account = {
      loading: true,
      account_name: name
    };
    TemplateVar.set(self, "account", account);

    ObservableAccounts.refresh(account).then(
      _account => {
        TemplateVar.set(self, "account", _account);
        let reactive_accounts = self.reactive_accounts.get();
        reactive_accounts[account.account_name] = _account;
        self.reactive_accounts.set(reactive_accounts);
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
