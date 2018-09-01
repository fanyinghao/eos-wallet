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

Template['elements_transactions_table'].onCreated(function() {
  this._properties = {
    cursor: {}
  };

  let self = this


  Tracker.autorun(function() {
    Helpers.getActions(self.data.account_name, -1, -defaultLimit, actions => {
      TemplateVar.set(self, 'actions', actions);
      if(actions.length > 0) {
        TemplateVar.set(self, 'lastSeq', actions[0].account_action_seq);
        TemplateVar.set(self, 'position', actions[actions.length - 1].account_action_seq);
      }
      else
        TemplateVar.set(self, 'position', -1);
    })
  })
});

Template['elements_transactions_table'].helpers({
  /**
    Changes the limit of the given cursor

    @method (items)
    @return {Object} The items cursor
    */
  items: function() {
    let actions = TemplateVar.get('actions')
    return actions|| [];


    var template = Template.instance(),
      items = [],
      searchQuery = TemplateVar.get('search'),
      limit = TemplateVar.get('limit'),
      collection = window[this.collection] || Transactions,
      selector = this.ids ? { _id: { $in: this.ids } } : {};

    // if search
    if (searchQuery) {
      var pattern = new RegExp(
        '^.*' + searchQuery.replace(/ +/g, '.*') + '.*$',
        'i'
      );
      template._properties.cursor = collection.find(selector, {
        sort: { timestamp: -1, blockNumber: -1 }
      });
      items = template._properties.cursor.fetch();
      items = _.filter(items, function(item) {
        // search from address
        if (pattern.test(item.from)) return item;

        // search to address
        if (pattern.test(item.to)) return item;

        // search value
        if (
          pattern.test(
            EthTools.formatBalance(item.value, '0,0.00[000000] unit')
          )
        )
          return item;

        // search date
        if (pattern.test(moment.unix(item.timestamp).format('LLLL')))
          return item;

        return false;
      });
      items = items.slice(0, defaultLimit * 4);
      return items;
    } else {
      template._properties.cursor = collection.find(selector, {
        sort: { timestamp: -1, blockNumber: -1 },
        limit: limit
      });
      return template._properties.cursor.fetch();
    }
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

    if(position === -1 || position === 0)
      return false;
    return actions && actions.length !== lastSeq + 1;
  }
});

Template['elements_transactions_table'].events({
  'click button.show-more': function(e, template) {
    let position = TemplateVar.get('position')
    let actions = TemplateVar.get('actions');

    if(position === -1)
      return;

    Helpers.getActions(this.account_name, position - defaultLimit - 1, defaultLimit, _actions => {
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
