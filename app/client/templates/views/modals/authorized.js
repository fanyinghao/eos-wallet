const keystore = require("../../../lib/eos/keystore");
/**
Template Controllers

@module Templates
*/

Template.authorized.onCreated(function() {
  TemplateVar.set("title", this.data.title.string);
});

Template.authorized.helpers({
  title: function() {
    return TemplateVar.get("title");
  },
  isMultiSig: function() {
    return this.isMultiSig;
  }
});

Template.authorized.onRendered(() => {
  this.$('input[name="password"]').focus();
});

Template.authorized.events({
  /**
    @event change select[name="dapp-select-proposer"]
    */
  'change select[name="dapp-select-proposer"]': function(e) {
    let name = e.currentTarget.value;
    TemplateVar.set("selectedProposer", name);
    TemplateVar.set(
      "title",
      new Spacebars.SafeString(
        TAPi18n.__("wallet.send.tradeRam.authtitle", {
          name: name
        })
      ).string
    );
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
    Submit the form

    @event submit form
    */
  "submit form": function(e, template) {
    let password = TemplateVar.get("password");

    if (!password || password.length === 0)
      return GlobalNotification.warning({
        content: "i18n:wallet.accounts.wrongPassword",
        duration: 2
      });

    try {
      let sensitive = keystore.Get(this.account_name, password).sensitive;
      if (!sensitive) throw new Error("wrong password");

      let signProvider = keystore.SignProvider(this.account_name, password);

      if (this.callback)
        this.callback({
          signProvider,
          privateKey: this.requirePrivateKey ? sensitive.privateKey : null,
          proposer: TemplateVar.get("selectedProposer")
        });
    } catch (e) {
      Helpers.handleError(e);
    }
  }
});
