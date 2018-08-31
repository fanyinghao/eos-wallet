/**
Template Controllers

@module Templates
*/

/**
The transaction info template

@class [template] views_modals_transactionInfo
@constructor
*/

Template['views_modals_transactionInfo'].helpers({
  /**
    Returns the current transaction

    @method (transaction)
    @return {Object} the current transaction
    */
  transaction: function() {
    return this;
  },
  transactionMonitor: function() {
    return transactionMonitor;
  }
});
