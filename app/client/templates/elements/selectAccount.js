/**
Template Controllers
@module Templates
*/

/**
The select account template
@class [template] selectAccount
@constructor
*/

Template["selectAccount"].onCreated(function() {
  if (this.data) {
    if (this.data.value) {
      TemplateVar.set("value", this.data.value);
    } else if (this.data.accounts && this.data.accounts[0]) {
      TemplateVar.set("value", this.data.accounts[0].account_name);
    }
  }
});

Template["selectAccount"].helpers({
  /**
      Return the selected attribute if its selected
      @method (selected)
      */
  selected: function() {
    const value = TemplateVar.get("value");
    return value === this.account_name ? { selected: true } : {};
  },
  className: function() {
    return this.class;
  }
});

Template["selectAccount"].events({
  /**
      Set the selected address.
      
      @event change select
      */
  "change select": function(e) {
    TemplateVar.set("value", e.currentTarget.value);
  }
});
