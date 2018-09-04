/**
Template Controllers

@module Templates
*/

/**
The transaction row template

@class [template] elements_transactions_table
@constructor
*/

/**
The default limit, of none is given.

@property defaultLimit
@type Number
*/
var defaultLimit = 30;
var reactive_account_name = new ReactiveVar();

Template['elements_transactions_table'].onCreated(function() {
  let self = this;

  reactive_account_name.set(self.data.account_name);

  Tracker.autorun(function() {
    let account_name = reactive_account_name.get();

    Helpers.getActions(account_name, -1, -defaultLimit, actions => {
      TemplateVar.set(self, 'actions', actions);
      if (actions.length > 0) {
        TemplateVar.set(self, 'lastSeq', actions[0].account_action_seq);
        TemplateVar.set(
          self,
          'position',
          actions[actions.length - 1].account_action_seq
        );
      } else TemplateVar.set(self, 'position', -1);
    });
  });
});

Template['elements_transactions_table'].helpers({
  /**
    Changes the limit of the given cursor

    @method (items)
    @return {Object} The items cursor
    */
  items: function() {
    let actions = TemplateVar.get('actions');
    let account_name = reactive_account_name.get();
    if (this.account_name != account_name) {
      reactive_account_name.set(this.account_name);
    }

    return actions || [];
  },
  /**
    Check if there are more transactions to load. When searching don't show the show more button.

    @method (hasMore)
    @return {Boolean}
    */
  hasMore: function() {
    let lastSeq = TemplateVar.get('lastSeq');
    let actions = TemplateVar.get('actions');
    let position = TemplateVar.get('position');

    if (position === -1 || position === 0) return false;
    return actions && actions.length !== lastSeq + 1;
  }
});

Template['elements_transactions_table'].events({
  'click button.show-more': function(e, template) {
    let position = TemplateVar.get('position');
    let actions = TemplateVar.get('actions');

    if (position === -1) return;

    Helpers.getActions(
      template.data.account_name,
      position - defaultLimit - 1,
      defaultLimit,
      _actions => {
        actions = actions.concat(_actions);
        TemplateVar.set(template, 'actions', actions);
        TemplateVar.set(
          template,
          'position',
          actions[actions.length - 1].account_action_seq
        );
      }
    );
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
    };
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
  typeName: function() {
    return `wallet.transactions.types.${this.action_trace.act.name}`;
  }
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
