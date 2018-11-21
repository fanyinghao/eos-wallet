const keystore = require('../../lib/eos/keystore');
const http = require('../../lib/helpers/http');
Eos = require('eosjs');
/**
Template Controllers

@module Templates
*/

/**
The add user template

@class [template] views_settings
@constructor
*/

// Set basic variables
Template['views_settings'].onCreated(function() {});

var reactive_nodes = new ReactiveVar({});
var reactive_custom_nodes = new ReactiveVar(
  JSON.parse(localStorage.getItem('custom_nodes'))
);
var reactive_cur_node = new ReactiveVar(
  JSON.parse(localStorage.getItem('cur_node'))
);

Template.views_settings.onRendered(function() {
  var template = this;
  var nodes = reactive_nodes.get();
  var custom_nodes = reactive_custom_nodes.get();

  Tracker.autorun(c => {
    Helpers.getProducers().then(data => {
      nodes = data.reduce((map, item) => {
        map[item.owner] = item;
        return map;
      }, {});

      if (custom_nodes)
        Array.prototype.forEach.call(custom_nodes, (item, index, arr) => {
          http
            .ping({
              url: item.node + '/v1/history/get_actions',
              method: 'post'
            })
            .then(tls => {
              arr[index].tls = tls;
              reactive_custom_nodes.set(arr);
            });
        });

      Array.prototype.forEach.call(data, item => {
        http
          .get({
            url: item.url + '/bp.json'
          })
          .then(
            res => {
              let peers = JSON.parse(res).nodes.filter(i => {
                return (
                  (i.api_endpoint && i.api_endpoint.length > 0) ||
                  (i.ssl_endpoint && i.ssl_endpoint.length > 0)
                );
              });
              Array.prototype.forEach.call(peers, node => {
                let url = node.ssl_endpoint
                  ? node.ssl_endpoint
                  : node.api_endpoint;
                http
                  .ping({
                    url: url + '/v1/history/get_actions',
                    method: 'post'
                  })
                  .then(tls => {
                    nodes[item.owner].tls = tls;
                    nodes[item.owner].node = url;
                    reactive_nodes.set(nodes);
                  });
              });
            },
            err => {
              console.error(err);
            }
          );
      });
    });
  });
});

Template['views_settings'].helpers({
  nodes: function() {
    let nodes = reactive_nodes.get();
    let custom_nodes = reactive_custom_nodes.get();
    if (!custom_nodes) custom_nodes = [];

    return custom_nodes.concat(Object.values(nodes));
  },
  curNode: function() {
    let cur_node = reactive_cur_node.get();
    return cur_node;
  }
});

Template['views_settings'].events({
  'click tr': function(e) {
    if (!this.node) return;
    reactive_cur_node.set({ owner: this.owner, node: this.node });
    localStorage.setItem(
      'cur_node',
      JSON.stringify({ owner: this.owner, node: this.node })
    );
    reload_chain(this.node);
  },
  'keyup input[name="addNode"], change input[name="addNode"], input input[name="addNode"]': function(
    e,
    template
  ) {
    TemplateVar.set('new_node', e.currentTarget.value);
  },
  'click button.dapp-block-button': function(e, template) {
    let custom_nodes = reactive_custom_nodes.get();
    let new_ndoe = TemplateVar.get('new_node');

    if (!new_ndoe) return;

    if (!custom_nodes) custom_nodes = [];
    TemplateVar.set(template, 'sending', true);

    http
      .ping({
        url: new_ndoe + '/v1/history/get_actions',
        method: 'post'
      })
      .then(tls => {
        template.$('input[name="addNode"]').val('');
        TemplateVar.set(template, 'new_node', '');

        let node = { owner: new_ndoe, node: new_ndoe, tls: tls };
        custom_nodes.unshift(node);
        localStorage.setItem('custom_nodes', JSON.stringify(custom_nodes));
        reactive_custom_nodes.set(custom_nodes);
        TemplateVar.set(template, 'sending', false);
      });
  }
});
