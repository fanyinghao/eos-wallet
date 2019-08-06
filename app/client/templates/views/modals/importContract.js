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
  options: function() {
    return TemplateVar.get("options");
  },
  loading: function() {
    return TemplateVar.get("loading");
  },
  btnDisabled: function() {
    const options = TemplateVar.get("options");
    const symbol = TemplateVar.get("symbol");
    const selectedSymbol = TemplateVar.get("selectedSymbol");

    if (selectedSymbol && selectedSymbol.length > 0) {
      return {};
    }

    return options && options.length > 0 && symbol != "wrong contract"
      ? {}
      : { disabled: "disabled" };
  }
});

Template["importContract"].events({
  'change input[name="contact_add"]': function(e, template) {
    TemplateVar.set(template, "loading", true);
    TemplateVar.set(template, "contract", "");
    TemplateVar.set(template, "options", null);
    TemplateVar.set(template, "symbol", "");
    TemplateVar.set(template, "selectedSymbol", "");
    const value = e.currentTarget.value;
    if (!value) return;

    EOS.RPC.get_currency_balance(value, value).then(
      resp => {
        // if (resp.length > 0) {
        //   const amount = resp[0].split(" ")[0];
        //   const symbol = resp[0].split(" ")[1];
        //   const idx = amount.indexOf(".");
        //   const precise = amount.length - (idx === -1 ? 0 : idx) - 1;
        //   TemplateVar.set(template, "contract", value);
        //   TemplateVar.set(template, "symbol", symbol);
        // }
        TemplateVar.set(template, "options", resp);
        TemplateVar.set(template, "loading", false);
        if (resp.length > 0) {
          TemplateVar.set(template, "contract", value);
          TemplateVar.set(template, "selectedSymbol", resp[resp.length - 1]);
        } else {
          TemplateVar.set(template, "contract", value);
          TemplateVar.set(template, "options", null);
        }
      },
      err => {
        TemplateVar.set(template, "loading", false);
        TemplateVar.set(template, "symbol", "wrong contract");
      }
    );
  },
  /**
    change symbol

    @event change input.selectSymbol
    */
  'change input[name="selectSymbol"]': function(e) {
    const value = $(e.currentTarget)[0].value;
    TemplateVar.set("selectedSymbol", value);
  },
  'change input[name="inputSymbol"]': function(e) {
    const value = $(e.currentTarget)[0].value;
    TemplateVar.set("selectedSymbol", value);
  },
  'change input[name="inputPrecise"]': function(e) {
    const value = $(e.currentTarget)[0].value;
    TemplateVar.set("inputPrecise", value);
  },
  'click button.dapp-block-button[name="btn_add"]': function(e, template) {
    debugger;
    var token_contracts =
      JSON.parse(localStorage.getItem("token_contracts")) || [];
    const contract = TemplateVar.get(template, "contract");
    const selectedSymbol = TemplateVar.get(template, "selectedSymbol");
    const inputPrecise = TemplateVar.get(template, "inputPrecise");
    const balance = Helpers.formatBalance(selectedSymbol);
    if (contract) {
      const new_item = {
        contract,
        symbol: inputPrecise ? selectedSymbol.trim() : balance.symbol,
        precise: inputPrecise ? parseInt(inputPrecise.trim()) : balance.precise
      };

      const idx = token_contracts.findIndex(item => {
        return item.contract === contract && item.symbol === balance.symbol;
      });

      if (idx !== -1) {
        token_contracts.splice(idx, 1);
      }

      token_contracts.push(new_item);
      localStorage.setItem("token_contracts", JSON.stringify(token_contracts));
      EthElements.Modal.hide();
      if (template.data.callback) {
        template.data.callback(new_item);
      }
    }
  }
});
