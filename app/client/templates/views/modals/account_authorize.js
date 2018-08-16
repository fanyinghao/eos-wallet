const keystore = require("../../../lib/eos/keystore");
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
    let owners = this.owners;
    let insert = TemplateVar.get("multisigSignees") - owners.length;
    if (insert < 0){
      insert = TemplateVar.get("multisigSignees");
      owners = new Array(insert).fill("")
    } else {
      owners = owners.concat(new Array(insert).fill(""));
    }

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
    for (i = 1; i <= maxOwners; i++) {
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

    for (i = 1; i <= signees; i++) {
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
    Create the account

    @event submit
    */
  submit: function(e, template) {
    let formValues = InlineForm(".inline-form");
    let password = TemplateVar.get("password");
    let threshold = TemplateVar.get("multisigSignatures");

    if (this.account && !TemplateVar.get("sending")) {
      if (!password || password.length === 0)
        return GlobalNotification.warning({
          content: "i18n:wallet.accounts.wrongPassword",
          duration: 2
        });

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

      try {
        TemplateVar.set(template, "sending", true);

        let provider = keystore.SignProvider(
          this.account.account_name,
          password
        );
        const _eos = Eos({
          httpEndpoint: httpEndpoint,
          chainId: chainId,
          signProvider: provider,
          verbose: false
        });

        let required_auth = {
          keys: Array.prototype.map.call(owners, function(obj) {
            return {
              key: obj,
              weight: 1
            };
          }),
          threshold: threshold
        };

        _eos
          .transaction(tr => {
            tr.updateauth(
              {
                account: this.account.account_name,
                permission: "active",
                parent: "owner",
                auth: required_auth
              },
              { authorization: `${this.account.account_name}@owner` }
            );
          })
          .then(
            tr => {
              console.log(tr);
              TemplateVar.set(template, "sending", false);
              EthElements.Modal.hide();

              GlobalNotification.success({
                content: "i18n:wallet.authMultiSig.success",
                duration: 2
              });
            },
            err => {
              TemplateVar.set(template, "sending", false);

              GlobalNotification.error({
                content: JSON.parse(err).error.message,
                duration: 20
              });
              return;
            }
          );
      } catch (e) {
        console.log(e);
        TemplateVar.set(template, "sending", false);
        if (
          e.message === "wrong password" ||
          e.message === "gcm: tag doesn't match"
        ) {
          GlobalNotification.warning({
            content: "i18n:wallet.accounts.wrongPassword",
            duration: 2
          });
          return;
        }
      }
    }
  }
});
