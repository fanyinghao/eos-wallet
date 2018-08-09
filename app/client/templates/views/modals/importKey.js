/**
The template to display qrCode.

@class [template] views_modals_qrCode
@constructor
*/

Template["importKey"].onRendered(function() {
  if (this.data && this.data.accounts) {
    TemplateVar.set(this, "importedAccounts", this.data.accounts.account_names);
  }
});

Template["importKey"].helpers({
  importedAccounts: function() {
    return TemplateVar.get("importedAccounts");
  }
});

Template["importKey"].events({
  /**
      back to dashboard
    */
  'click button.dapp-block-button[name="btn_back"]': function (e) {
    FlowRouter.go('dashboard');
  },
});
