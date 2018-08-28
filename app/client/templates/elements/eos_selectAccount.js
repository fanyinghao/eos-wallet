/**
Template Controllers
@module Templates
*/

/**
The select account template
@class [template] eos_selectAccount
@constructor
*/

Template['eos_selectAccount'].onCreated(function() {
  var template = this;
  if (template.data) {
    template.autorun(function(c) {
      if (template.data.value) {
        TemplateVar.set('value', template.data.value);
      } else if (template.data.accounts && template.data.accounts[0]) {
        TemplateVar.set('value', template.data.accounts[0].account_name);
      }
    });
  }
});

Template['eos_selectAccount'].helpers({
  /**
      Return the selected attribute if its selected
      @method (selected)
      */
  selected: function() {
    return TemplateVar.get('value') === this.accountName
      ? { selected: true }
      : {};
  },
  className: function() {
    return this.class;
  }
});

Template['eos_selectAccount'].events({
  /**
      Set the selected account.
      
      @event change select
      */
  'change select[name="dapp-select-account"]': function(e) {
    TemplateVar.set('value', e.currentTarget.value);
  }
});
