/**
Template Controllers

@module Templates
*/

/**
The account authorize template

@class [template] views_account_authorize
@constructor
*/

Template["views_account_authorize"].onCreated(function() {});

Template["views_account_authorize"].onRendered(function() {
  let self = this;
  let type = "active";
  TemplateVar.set("type", type);
  this.$("input.owners").focus();

  Tracker.autorun(function() {
    type = TemplateVar.get(self, "type");
    let permission = self.data.account.permissions.filter(item => {
      return item.perm_name === type;
    })[0];

    if (!permission) return;

    TemplateVar.set(
      self,
      "multisigSignees",
      permission.required_auth.keys.length +
        permission.required_auth.accounts.length
    );

    // number of required signatures
    TemplateVar.set(
      self,
      "multisigSignatures",
      permission.required_auth.threshold
    );
  });
});

Template["views_account_authorize"].helpers({
  checked: function(type) {
    return TemplateVar.get("type") === type;
  },
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
    let type = TemplateVar.get("type");
    let permission = this.account.permissions.filter(item => {
      return item.perm_name === type;
    })[0];

    if (!permission) return [];

    let owners = Array.prototype.concat(
      permission.required_auth.keys.map(val => {
        return val.key;
      }),
      permission.required_auth.accounts.map(val => {
        return val.permission.actor;
      })
    );
    let insert = TemplateVar.get("multisigSignees") - owners.length;
    if (insert < 0) {
      insert = TemplateVar.get("multisigSignees");
      owners = owners.slice(0, insert);
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
    Get the number of required multisignees (account owners)

    @method (multisigSignees)
    */
  multisigSignees: function() {
    let type = TemplateVar.get("type");
    let permission = this.account.permissions.filter(item => {
      return item.perm_name === type;
    })[0];

    if (!permission) return [];

    var maxOwners =
      permission.required_auth.keys.length +
      permission.required_auth.accounts.length;
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
  Select the current section, based on the radio inputs value.

  @event change input[name="choose-type"]
  */
  'change input[name="choose-type"]': function(e, template) {
    TemplateVar.set("type", e.currentTarget.value);
  },
  /**
    Create the account

    @event submit
    */
  submit: function(e, template) {
    let formValues = InlineForm(".inline-form");
    let threshold = TemplateVar.get("multisigSignatures");
    let type = TemplateVar.get("type");
    let self = this;

    function updateauth(signProvider) {
      try {
        TemplateVar.set(template, "sending", true);

        const _eos = Eos({
          httpEndpoint: httpEndpoint,
          chainId: chainId,
          signProvider: signProvider,
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
                permission: type,
                parent: type === "owner" ? "" : "owner",
                auth: required_auth
              },
              {
                authorization: `${self.account.account_name}@owner`,
                broadcast: true,
                sign: true
              }
            );
          })
          .then(
            tr => {
              console.log(tr);
              TemplateVar.set(template, "sending", false);
              EthElements.Modal.hide();

              if (self.callback) self.callback();

              GlobalNotification.success({
                content:
                  type !== "owner"
                    ? "i18n:wallet.authMultiSig.success"
                    : "i18n:wallet.authMultiSig.requireImport",
                duration: type !== "owner" ? 2 : 10
              });
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
          callback: ({ signProvider }) => {
            updateauth(signProvider);
            //refresh account

            return true;
          }
        }
      });
    }
  }
});
