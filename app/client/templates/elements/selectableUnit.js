/**
Template Controllers

@module Templates
*/

/**
The balance template

@class [template] elements_balance
@constructor
*/

/**
The available units

@property selectableUnits
*/
selectableUnits = [
  {
    text: 'EOS',
    value: 'eos'
  }
];

Template['elements_selectableUnit'].helpers({
  /**
    Gets currently selected unit

    @method (selectedUnit)
    */
  selectedUnit: function() {
    // var unit = _.find(selectableUnits, function(unit) {
    //   return unit.value === EthTools.getUnit();
    // });

    // if (unit) return unit.value;
    return "eos";
  },
  /**
    Return the selectable units

    @method (selectedUnit)
    */
  units: function() {
    return selectableUnits;
  },
  /**
    Can select units

    @method (selectedUnit)
    */
  selectable: function() {
    return Session.get('network') == 'main';
  }
});

Template['elements_selectableUnit'].events({
  /**
    Select the current section, based on the radio inputs value.

    @event change .inline-form
    */
  'change .inline-form': function(e, template, value) {
    EthTools.setUnit(value);
  }
});
