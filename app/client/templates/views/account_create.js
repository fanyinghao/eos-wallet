const ecc = require("eosjs-ecc");
const keystore = require("../../lib/eos/keystore");
/**
Template Controllers

@module Templates
*/

/**
The account create template

@class [template] views_account_create
@constructor
*/

Template["views_account_create"].onCreated(function() {
  TemplateVar.set("selectedSection", "simple");
});

Template["views_account_create"].onRendered(function() {
  // focus the input
  this.$('input[name="accountName"]').focus();
});

Template["views_account_create"].helpers({
  /**
    Return TRUE, if the current section is selected

    @method (showSection)
    */
  showSection: function(section) {
    return TemplateVar.get("selectedSection") === section;
  },
  /**
    Translates to 'owner address'

    @method (i18nOwnerAddress)
    */
  i18nOwnerAddress: function() {
    return TAPi18n.__("wallet.newWallet.accountType.multisig.ownerAddress");
  },
  /**
    Translates to 'private key'

    @method (i18nPrivateKey)
    */
  i18nPrivateKey: function() {
    return TAPi18n.__("wallet.newWallet.accountType.import.privateKey");
  },
  /**
    Is simple checked

    @method (simpleCheck)
    */
  simpleCheck: function() {
    return TemplateVar.get("selectedSection") === "simple" ? "checked" : "";
  },
  /**
    Is multisig checked

    @method (multisigCheck)
    */
  multisigCheck: function() {
    return TemplateVar.get("selectedSection") === "multisig" ? "checked" : "";
  }
});

Template["views_account_create"].events({
  /**
    Select the current section, based on the radio inputs value.

    @event change input[type="radio"]
    */
  'change input[type="radio"]': function(e) {
    TemplateVar.set("selectedSection", e.currentTarget.value);
  },
  /**
    input password, based on the password inputs value.

    @event change input[type="password"]
    */
  "change input[name=rePassword]": function(e, template) {
    let password = template.find('input[name="password"]').value;
    let rePassword = e.currentTarget.value;
    if (password !== rePassword)
      return GlobalNotification.warning({
        content: "i18n:wallet.accounts.matchPassword",
        duration: 2
      });
  },
  /**
    Create the account

    @event submit
    */
  submit: function(e, template) {
    var type = TemplateVar.get("selectedSection");

    try {
      if (!TemplateVar.get("sending")) {
        // SIMPLE
        if (type === "simple") {
          let accountName = template
            .find('input[name="accountName"]')
            .value.trim();
          let password = template.find('input[name="password"]').value;
          let rePassword = template.find('input[name="rePassword"]').value;

          if (password.length === 0 || password !== rePassword)
            return GlobalNotification.warning({
              content: "i18n:wallet.accounts.matchPassword",
              duration: 2
            });

          if (
            accountName.length !== 12 &&
            !eos.modules.format.isName(accountName, err => {
              return GlobalNotification.warning({
                content: err.message,
                duration: 2
              });
            })
          )
            return;

          let exists = keystore.Get(accountName);
          if (exists && exists.encryptedData)
            return GlobalNotification.warning({
              content: "i18n:wallet.newWallet.error.alreadyExists",
              duration: 2
            });

          TemplateVar.set("sending", true);

          eos.getAccount(accountName).then(
            account => {
              TemplateVar.set(template, "sending", false);

              return GlobalNotification.warning({
                content: "i18n:wallet.newWallet.error.alreadyExists",
                duration: 2
              });
            },
            err => {
              TemplateVar.set(template, "sending", false);

              ecc.randomKey().then(active_privateKey => {
                let active_publicKey = ecc.privateToPublic(active_privateKey);

                ecc.randomKey().then(owner_privateKey => {
                  let owner_publicKey = ecc.privateToPublic(owner_privateKey);
                  let active = {
                    privateKey: active_privateKey,
                    publicKey: active_publicKey
                  };
                  let owner = {
                    privateKey: owner_privateKey,
                    publicKey: owner_publicKey
                  };

                  keystore.SetKey(
                    accountName,
                    password,
                    {
                      active: active_privateKey,
                      owner: owner_privateKey
                    },
                    {
                      active: active_publicKey,
                      owner: owner_publicKey
                    }
                  );

                  EthElements.Modal.show(
                    {
                      template: "generateKey",
                      data: {
                        accountName: accountName,
                        keys: {
                          owner,
                          active
                        }
                      }
                    },
                    {
                      closeable: false,
                      class: "modal-small"
                    }
                  );
                });
              });
            }
          );
        }

        // IMPORT
        if (type === "import") {
          let password = template.find('input[name="password"]').value;
          let rePassword = template.find('input[name="rePassword"]').value;
          let privateKey = template.find('input[name="privateKey"]').value;
          let publicKey = ecc.privateToPublic(privateKey);

          if (password.length === 0 || password !== rePassword)
            return GlobalNotification.warning({
              content: "i18n:wallet.accounts.matchPassword",
              duration: 2
            });

          TemplateVar.set("sending", true);

          eos.getKeyAccounts(publicKey).then(
            accounts => {
              TemplateVar.set(template, "sending", false);

              if (accounts.account_names.length === 0) {
                return GlobalNotification.error({
                  content: "wrong key",
                  duration: 20
                });
              }

              accounts.account_names.forEach(name => {
                eos.getAccount(name).then(_account => {
                  let _tmp_pub = {};
                  let _tmp_priv = {};
                  _account.permissions.forEach(item => {
                    if (
                      item.required_auth.keys.some(k => {
                        return k.key === publicKey;
                      })
                    ) {
                      _tmp_pub[item.perm_name] = publicKey;
                      _tmp_priv[item.perm_name] = privateKey;
                    }
                  });
                  // storage private key
                  keystore.SetKey(name, password, _tmp_priv, _tmp_pub);
                });

                eos.getControlledAccounts(name).then(_accounts => {
                  _accounts.controlled_accounts.forEach(_name => {
                    if (!keystore.Get(_name)) keystore.SetAccount(_name);
                  });
                });
              });

              EthElements.Modal.show(
                {
                  template: "importKey",
                  data: {
                    accounts: accounts
                  }
                },
                {
                  closeable: false
                }
              );
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
        }
      }
    } catch (err) {
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
});
