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
    if (insert < 0) {
      insert = TemplateVar.get("multisigSignees");
      owners = new Array(insert).fill("");
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
    Create the account

    @event submit
    */
  submit: function(e, template) {
    let formValues = InlineForm(".inline-form");
    let threshold = TemplateVar.get("multisigSignatures");
    let self = this;

    function updateauth(privateKey) {
      try {
        TemplateVar.set(template, "sending", true);

        const _eos = Eos({
          httpEndpoint: httpEndpoint,
          chainId: chainId,
          keyProvider: [privateKey],
          verbose: false
        });

        let required_auth = {
          accounts: [],
          keys: [],
          threshold: threshold
        };

        owners.forEach(val => {
          val = val.trim();
          if (val.length === 12) {
            required_auth.accounts.push({
              permission: { actor: val, permission: "active" },
              weight: 1
            });
          } else {
            required_auth.keys.push({
              key: val,
              weight: 1
            });
          }
        });

        _eos
          .transaction(tr => {
            tr.updateauth(
              {
                account: self.account.account_name,
                permission: "active",
                parent: "owner",
                auth: required_auth
              },
              { authorization: `${self.account.account_name}@owner` }
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

              FlowRouter.go("/dashboard/");
            },
            err => {
              TemplateVar.set(template, "sending", false);

              if (err.message) {
                GlobalNotification.error({
                  content: err.message,
                  duration: 20
                });
              } else {
                let error = JSON.parse(err);
                GlobalNotification.error({
                  content: Helpers.translateExternalErrorMessage(error.error),
                  duration: 20
                });
              }
            }
          );
      } catch (e) {
        console.log(e);
        TemplateVar.set(template, "sending", false);
        if (err.message) {
          GlobalNotification.error({
            content: err.message,
            duration: 20
          });
        } else {
          let error = JSON.parse(err);
          GlobalNotification.error({
            content: Helpers.translateExternalErrorMessage(error.error),
            duration: 20
          });
        }
      }
    }

    if (this.account && !TemplateVar.get("sending")) {
      var owners = _.uniq(
        _.compact(
          _.map(template.findAll("input.owners"), function(item) {
            return item.value;
          })
        )
      );

      if (owners.length != formValues.multisigSignees)
        return GlobalNotification.warning({
          content: "i18n:wallet.newWallet.error.emptySignees",
          duration: 2
        });

      EthElements.Modal.show({
        template: "authorized",
        data: {
          account_name: self.account.account_name,
          callback: privateKey => {
            updateauth(privateKey);
            //refresh account

            return true;
          }
        }
      });
    }
  }
});
