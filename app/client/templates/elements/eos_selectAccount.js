/**
Template Controllers
@module Templates
*/

/**
The select account template
@class [template] eos_selectAccount
@constructor
*/

Template["eos_selectAccount"].onCreated(function() {
  var template = this;
  if (template.data) {
    template.autorun(function(c) {
      if (template.data.value) {
        TemplateVar.set("value", template.data.value.account_name);
      } else if (template.data.accounts && template.data.accounts[0]) {
        TemplateVar.set("value", template.data.accounts[0].account_name);
      }
    });
  }
});

Template["eos_selectAccount"].helpers({
  className: function() {
    return this.class;
  },
  value: function() {
    const value = TemplateVar.get("value");
    return value;
  }
});

Template["eos_selectAccount"].events({
  /**
      Set the selected account.
      
      @event change select
      */
  'change select[name="dapp-select-account"]': function(e) {
    TemplateVar.set("value", e.currentTarget.value);
  }
});
