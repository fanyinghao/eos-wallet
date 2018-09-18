/**
The template to display qrCode.

@class [template] views_modals_qrCode
@constructor
*/

Template["generateKey"].helpers({
  data: function() {
    return this;
  }
});

Template["generateKey"].events({
  'click button.dapp-block-button[name="btn_copy"]': function(e) {
    Helpers.copyAddress(e.currentTarget.parentNode.querySelector(".keys"));
  },
  /**
      back to dashboard
    */
  'click a[name="go-send"]': function(e) {
    FlowRouter.go("newaccount", null, {
      accountName: this.accountName,
      owner: this.keys.owner.publicKey,
      active: this.keys.active.publicKey
    });
  }
});
