/**
Template Controllers
@module Templates
*/

/**
The select account template
@class [template] eos_selectToken
@constructor
*/

Template["eos_selectToken"].onCreated(function() {
  var template = this;
});

Template["eos_selectToken"].helpers({
  /**
      Return the selected attribute if its selected
      @method (selected)
      */
  selected: function() {
    const selected = TemplateVar.get("selected");
    return selected === this.contract || this.selected
      ? { selected: true }
      : {};
  },
  className: function() {
    return this.class;
  },
  tokens: function() {
    var contracts = TemplateVar.get("contracts");
    if (!contracts) {
      contracts = Helpers.getTokenCached();
      TemplateVar.set("contracts", contracts);
    }
    return contracts;
  }
});

Template["eos_selectToken"].events({
  /**
      Set the selected token.
      
      @event change select
      */
  'change select[name="dapp-select-token"]': function(e, template) {
    const value = e.currentTarget.value;
    TemplateVar.set("selected", value);
    if (value === "add") {
      EthElements.Modal.show({
        template: "importContract",
        data: {
          callback: added => {
            const contracts = Helpers.getTokenCached();
            TemplateVar.set(template, "contracts", contracts);
            TemplateVar.set(template, "selected", added);
          }
        }
      });
    }
  }
});
