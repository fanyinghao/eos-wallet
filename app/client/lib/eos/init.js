const { Api, JsonRpc } = require("eosjs");
const { observableAccounts } = require("./observableAccounts");
ObservableAccounts = observableAccounts;

chains = {
  zbeos: {
    httpEndpoint: "https://node1.zbeos.com",
    chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
    transactionMonitor: "https://eospark.com/MainNet/tx"
  },
  zbeos测试: {
    httpEndpoint: "http://47.52.114.6:9999",
    chainId: "5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191",
    transactionMonitor: "https://tools.cryptokylin.io/#/tx"
  },
  eosasia: {
    httpEndpoint: "https://api1.eosasia.one",
    chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
    transactionMonitor: "https://www.myeoskit.com/tx"
  },
  eosasia测试: {
    httpEndpoint: "https://api-kylin.eosasia.one",
    chainId: "5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191",
    transactionMonitor: "https://tools.cryptokylin.io/#/tx"
  }
};

EOS = {};
let cur_node = JSON.parse(localStorage.getItem("cur_node"));
if (!cur_node) {
  cur_node = { node: chains.eosasia.httpEndpoint, owner: "eosasia" };
  localStorage.setItem("cur_node", JSON.stringify(cur_node));
}
httpEndpoint = cur_node ? cur_node.node : "";
transactionMonitor = "";
chainId = "";
var cur_chain = localStorage.getItem("cur_chain");

reload_chain = function(_endpoint) {
  let node = chains[cur_chain];

  if (_endpoint) httpEndpoint = _endpoint;
  if (!_endpoint && !httpEndpoint) httpEndpoint = node.httpEndpoint;
  transactionMonitor = node.transactionMonitor;
  chainId = node.chainId;

  const rpc = new JsonRpc(httpEndpoint);
  EOS = {
    RPC: rpc,
    API: new Api({ rpc, chainId })
  };

  ObservableAccounts.accounts = [];
};

if (!cur_chain) {
  localStorage.setItem("cur_chain", "eosasia");
  cur_chain = "eosasia";
}
reload_chain();
