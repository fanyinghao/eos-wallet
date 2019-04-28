/**
The template to display qrCode.

@class [template] views_modals_qrCode
@constructor
*/

Template["importContract"].onRendered(function() {
  this.$('input[name="contact_add"]').focus();
  if (this.data && this.data.accounts) {
    TemplateVar.set(this, "importedAccounts", this.data.accounts.account_names);
  }
});

Template["importContract"].helpers({
  symbol: function() {
    return TemplateVar.get("symbol");
  },
  loading: function() {
    return TemplateVar.get("loading");
  },
  btnDisabled: function() {
    const symbol = TemplateVar.get("symbol");
    return symbol && symbol != "wrong contract" ? {} : { disabled: "disabled" };
  }
});

Template["importContract"].events({
  /**
      back to dashboard
    */
  'click button.dapp-block-button[name="btn_back"]': function(e) {
    FlowRouter.go("dashboard");
  },
  'change input[name="contact_add"]': function(e, template) {
    TemplateVar.set(template, "loading", true);
    TemplateVar.set(template, "contract", "");
    TemplateVar.set(template, "symbol", "");
    const value = e.currentTarget.value;
    if (!value) return;

    EOS.RPC.get_currency_balance(value, value).then(
      resp => {
        if (resp.length > 0) {
          const symbol = resp[0].split(" ")[1];
          TemplateVar.set(template, "contract", value);
          TemplateVar.set(template, "symbol", symbol);
          TemplateVar.set(template, "loading", false);
        }
      },
      err => {
        TemplateVar.set(template, "loading", false);
        TemplateVar.set(template, "symbol", "wrong contract");
      }
    );
  },
  'click button.dapp-block-button[name="btn_add"]': function(e, template) {
    const token_contracts =
      JSON.parse(localStorage.getItem("token_contracts")) || [];
    const contract = TemplateVar.get(template, "contract");
    const symbol = TemplateVar.get(template, "symbol");
    if (contract) {
      token_contracts.push({ contract, symbol });
      localStorage.setItem("token_contracts", JSON.stringify(token_contracts));
      EthElements.Modal.hide();
    }
  }
});
