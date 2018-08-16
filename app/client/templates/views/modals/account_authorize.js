const ecc = require("eosjs-ecc");
/**
Template Controllers

@module Templates
*/

/**
The account authorize template

@class [template] views_account_authorize
@constructor
*/

Template["views_account_authorize"].onCreated(function() {
  // number of owners of the account
  var maxOwners = this.data.owners.length;
  if (maxOwners) maxOwners++;
  TemplateVar.set("multisigSignees", maxOwners || 3);

  // number of required signatures
  TemplateVar.set(
    "multisigSignatures",
    Number(FlowRouter.getQueryParam("requiredSignatures")) || 2
  );
});

Template["views_account_authorize"].onRendered(function() {
  // focus the input`
  this.$('input[name="accountName"]').focus();
});

Template["views_account_authorize"].helpers({
  /**
    Return the selectedAccount

    @method (selectedAccount)
    */
  selectedAccount: function() {
    return this.account;
  },
  /**
    Return the number of signees fields

    @method (signees)
    @return {Array} e.g. [1,2,3,4]
    */
  signees: function() {
    var owners = this.owners;

    owners = owners.concat(
      new Array(TemplateVar.get("multisigSignees") - owners.length).fill('')
    );

    if (
      TemplateVar.get("multisigSignatures") > TemplateVar.get("multisigSignees")
    ) {
      TemplateVar.set("multisigSignatures", TemplateVar.get("multisigSignees"));
    }

    return owners;
  },
  /**
    Returns the class valid for valid addresses and invalid for non wallet addresses.

    @method (importValidClass)
    */
  importValidClass: function() {
    return TemplateVar.get("importWalletOwners") ? "valid" : "invalid";
  },
  /**
    Get the number of required multisignees (account owners)

    @method (multisigSignees)
    */
  multisigSignees: function() {
    var maxOwners = this.owners.length;
    if (maxOwners) maxOwners++;
    maxOwners = Math.max(maxOwners || 10, 10);

    var returnArray = [];
    for (i = 2; i <= maxOwners; i++) {
      returnArray.push({ value: i, text: i });
    }
    return returnArray;
  },
  /**
    Get the number of required multisignatures

    @method (multisigSignatures)
    */
  multisigSignatures: function() {
    var signees = TemplateVar.get("multisigSignees");
    var returnArray = [];

    for (i = 2; i <= signees; i++) {
      returnArray.push({ value: i, text: i });
    }

    return returnArray;
  }
});

Template["views_account_authorize"].events({
  /**
    Change the number of signatures

    @event click span[name="multisigSignatures"] .simple-modal button
    */
  'click span[name="multisigSignatures"] .simple-modal button': function(e) {
    TemplateVar.set("multisigSignatures", $(e.currentTarget).data("value"));
  },
  /**
    Change the number of signees

    @event click span[name="multisigSignees"] .simple-modal button
    */
  'click span[name="multisigSignees"] .simple-modal button': function(e) {
    TemplateVar.set("multisigSignees", $(e.currentTarget).data("value"));
  },

  /**
    Create the account

    @event submit
    */
  submit: function(e, template) {
    var formValues = InlineForm(".inline-form");

    var owners = _.uniq(
      _.compact(
        _.map(template.findAll("input.owners"), function(item) {
          if (ecc.isValidPublic(item.value)) return item.value;
        })
      )
    );

    if (owners.length != formValues.multisigSignees)
      return GlobalNotification.warning({
        content: "i18n:wallet.newWallet.error.emptySignees",
        duration: 2
      });

    GlobalNotification.success({
      content: "i18n:wallet.authMultiSig.success",
      duration: 2
    });

    EthElements.Modal.hide();
  }
});
