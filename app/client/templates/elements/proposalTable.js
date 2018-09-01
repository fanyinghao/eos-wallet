/**
Template Controllers

@module Templates
*/

/**
The proposal row template

@class [template] elements_proposal_table
@constructor
*/

/**
The default limit, of none is given.

@property defaultLimit
@type Number
*/
var defaultLimit = 30;
var reactive_account = new ReactiveVar();

Template['elements_proposal_table'].onCreated(function() {
  let self = this
  
  reactive_account.set(self.data.account)

  Tracker.autorun(function() {
    let account = reactive_account.get();

    Helpers.getProposals(account)
    .then(data => {
      console.log(data);
      return new Promise(data);
    })
    .catch(e => {})
    .finally(() => {});

  })
});

Template['elements_proposal_table'].helpers({
  /**
    Changes the limit of the given cursor

    @method (items)
    @return {Object} The items cursor
    */
  items: function() {
    let actions = TemplateVar.get('actions')
    // let account_name = reactive_account_name.get()
    // if(this.account_name != account_name) {
    //   reactive_account_name.set(this.account_name)
    // }

    return actions|| [];
  }
});

Template['elements_proposal_table'].events({
  'click button.show-more': function(e, template) {
    let position = TemplateVar.get('position')
    let actions = TemplateVar.get('actions');

    if(position === -1)
      return;

    Helpers.getActions(template.data.account_name, position - defaultLimit - 1, defaultLimit, _actions => {
      actions = actions.concat(_actions);
      TemplateVar.set(template, 'actions', actions);
      TemplateVar.set(template, 'position', actions[actions.length - 1].account_action_seq);
    })
  }
});

/**
The transaction row template

@class [template] elements_transactions_row
@constructor
*/

Template['elements_transactions_row'].helpers({

  jsonOptions: function() {
    return {
      collapsed: true
    }
  },
  /**
    Returns the from now time, if less than 23 hours

    @method (fromNowTime)
    @return {String}
    */
  fromNowTime: function() {
    Helpers.rerun['10s'].tick();
    var diff = moment().diff(moment.unix(this.block_time), 'hours');
    return diff < 23 ? ' ' + moment.unix(this.block_time).fromNow() : '';
  },
});

Template['elements_transactions_row'].events({
  /**
    Open transaction details on click of the <tr>

    @event click tr
    */
  'click tr:not(.pending)': function(e) {
    var $element = $(e.target);
    if (!$element.is('button') && !$element.is('a')) {
      EthElements.Modal.show(
        {
          template: 'views_modals_transactionInfo',
          data: this
        },
        {
          class: 'transaction-info'
        }
      );
    }
  }
});
