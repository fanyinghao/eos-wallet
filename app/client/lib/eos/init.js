Eos = require('eosjs');
const { observableAccounts } = require('./observableAccounts');

chains = {
  zbeos: {
    httpEndpoint: 'https://node1.zbeos.com',
    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    transactionMonitor: 'https://eosmonitor.io/txns'
  },
  'zbeos.kylin': {
    httpEndpoint: 'http://192.168.2.192:10053',
    chainId: '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191',
    transactionMonitor: 'https://tools.cryptokylin.io/#/tx'
  },
  eosasia: {
    httpEndpoint: 'https://api1.eosasia.one',
    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    transactionMonitor: 'https://www.myeoskit.com/#/tx'
  },
  'eosasia.kylin': {
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

reload_chain = function(node) {
  httpEndpoint = node.httpEndpoint;
  transactionMonitor = node.transactionMonitor;
  chainId = node.chainId;

  eos = Eos({
    httpEndpoint: httpEndpoint,
    chainId: chainId,
    verbose: false
  });
};

if (!chain_node) {
  localStorage.setItem('chain_node', 'zbeos');
  chain_node = 'zbeos';
}
reload_chain(chains[chain_node]);

ObservableAccounts = observableAccounts;
// ObservableAccounts.init();
