const keystore = require("../../../lib/eos/keystore");
/**
Template Controllers

@module Templates
*/

Template.authorized.helpers({
  title: function() {
    return this.title;
  }
});

Template.authorized.onRendered(() => {
  this.$('input[name="password"]').focus();
});

Template.authorized.events({
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
        this.callback(
          signProvider,
          this.requirePrivateKey ? sensitive.privateKey : null
        );
    } catch (e) {
      Helpers.handleError(e);
    }
  }
});
