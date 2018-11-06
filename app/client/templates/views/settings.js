const keystore = require("../../lib/eos/keystore");
const http = require("../../lib/helpers/http");
Eos = require("eosjs");
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
Template["views_settings"].onCreated(function() {});

var reactive_nodes = new ReactiveVar({});
var reactive_cur_node = new ReactiveVar(
  JSON.parse(localStorage.getItem("cur_node"))
);

Template.views_settings.onRendered(function() {
  var template = this;
  var nodes = reactive_nodes.get();

  Tracker.autorun(c => {
    Helpers.getProducers().then(data => {
      nodes = data.reduce((map, item) => {
        map[item.owner] = item;
        return map;
      }, {});
      reactive_nodes.set(nodes);

      Array.prototype.forEach.call(data, item => {
        http
          .get({
            url: item.url + "/bp.json"
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
                    url: url + "/v1/history/get_actions",
                    method: "post"
                  })
                  .then(tls => {
                    nodes[item.owner].tls = tls;
                    nodes[item.owner].node = url;
                    reactive_nodes.set(nodes);
                  });
              });
            },
            err => {
              console.log(err);
            }
          );
      });
    });
  });
});

Template["views_settings"].helpers({
  nodes: function() {
    let nodes = reactive_nodes.get();
    return Object.values(nodes);
  },
  curNode: function() {
    let cur_node = reactive_cur_node.get();
    return cur_node;
  }
});

Template["views_settings"].events({
  "click tr": function(e) {
    console.log("click", this);
    if (!this.node) return;
    reactive_cur_node.set({ owner: this.owner, node: this.node });
    localStorage.setItem(
      "cur_node",
      JSON.stringify({ owner: this.owner, node: this.node })
    );
    reload_chain(this.node);
  }
});
