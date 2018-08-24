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
  if (this.data) {
    if (this.data.value) {
      TemplateVar.set('value', this.data.value);
    } else if (this.data.accounts && this.data.accounts[0]) {
      TemplateVar.set("value", this.data.accounts[0].account_name);
    }
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
  className: function(){
    debugger
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
