/**
Template Controllers

@module Templates
*/

Template.eos_amount.helpers({
  /**
    Upgrade parameters for the wallet

    @method (fullString)
    */
  fullString: function() {
    return this.amount;
  },
  /**
    Return the wallet address if its an account

    @method (integerPart)
    */
   integerPart: function() {
    if(!this.amount) 
      return 0;
    let val = this.amount.replace('EOS', '').replace('eos', '').trim()
    let values = val.split('.');
    return values[0];
  },
  /**
    Return the wallet address if its an account

    @method (decimalPart)
    */
   decimalPart: function() {
    if(!this.amount) 
      return 0;
    let val = this.amount.replace('EOS', '').replace('eos', '').trim()
    let values = val.split('.');
    return values[1];
  }
});
