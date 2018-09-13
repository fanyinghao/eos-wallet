Eos = require('eosjs');
const { observableAccounts } = require('./observableAccounts');
ObservableAccounts = observableAccounts;

chains = {
  zbeos: {
    httpEndpoint: 'https://n4.zb.cn',
    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    transactionMonitor: 'https://eosmonitor.io/txns'
  },
  'zbeos测试': {
    httpEndpoint: 'https://testnet.zbeos.com',
    chainId: '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191',
    transactionMonitor: 'https://tools.cryptokylin.io/#/tx'
  },
  eosasia: {
    httpEndpoint: 'https://api1.eosasia.one',
    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    transactionMonitor: 'https://www.myeoskit.com/#/tx'
  },
  'eosasia测试': {
    httpEndpoint: 'https://api-kylin.eosasia.one',
    chainId: '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191',
    transactionMonitor: 'https://tools.cryptokylin.io/#/tx'
  }
};

eos = null;
httpEndpoint = '';
transactionMonitor = '';
chainId = '';
var chain_node = localStorage.getItem('chain_node');

reload_chain = function(_node) {
  localStorage.setItem('chain_node', _node);
  let node = chains[_node];

  httpEndpoint = node.httpEndpoint;
  transactionMonitor = node.transactionMonitor;
  chainId = node.chainId;

  eos = Eos({
    httpEndpoint: httpEndpoint,
    chainId: chainId,
    verbose: false
  });

  ObservableAccounts.accounts = [];
};

if (!chain_node) {
  localStorage.setItem('chain_node', 'zbeos');
  chain_node = 'zbeos';
}
reload_chain(chain_node);
