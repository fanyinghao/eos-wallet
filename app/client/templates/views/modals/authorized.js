const keystore = require("../../../lib/eos/keystore");
/**
Template Controllers

@module Templates
*/

Template.authorized.onCreated(function() {
  if (this.data.title) TemplateVar.set("title", this.data.title.string);
});

Template.authorized.helpers({
  title: function() {
    return TemplateVar.get("title");
  },
  isMultiSig: function() {
    return this.isMultiSig;
  },
  multiSigMsg: function() {
    return this.multiSigMsg;
  },
  range: function() {
    return this.range;
  }
});

Template.authorized.onRendered(function() {
  this.$('input[name="password"]').focus();

  if (this.data.isMultiSig) {
    let selectedProposer = TemplateVar.getFrom(
      "[name=dapp-select-proposer]",
      "value"
    );

    TemplateVar.set("selectedProposer", selectedProposer);
    TemplateVar.set(
      "title",
      new Spacebars.SafeString(
        TAPi18n.__("wallet.send.tradeRam.authtitle", {
          name: selectedProposer
        })
      ).string
    );
  }
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
    let account_name = this.isMultiSig
      ? TemplateVar.get("selectedProposer")
      : this.account_name;

    if (!password || password.length === 0)
      return GlobalNotification.warning({
        content: "i18n:wallet.accounts.wrongPassword",
        duration: 2
      });

    try {
      let sensitive = keystore.Get(account_name, password).sensitive;
      if (!sensitive) throw new Error("wrong password");

      let signProvider = keystore.SignProvider(account_name, password);

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
