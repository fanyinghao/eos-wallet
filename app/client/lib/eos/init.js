Eos = require('eosjs')
const {observableAccounts} = require('./observableAccounts')

// httpEndpoint = 'http://192.168.2.192:10053';
httpEndpoint = 'https://api-kylin.eosasia.one';

chain = {
    mainnet: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    testnet: '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191',
    sysnet: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f'
}

chainId = chain.testnet

eos = Eos({
    httpEndpoint: httpEndpoint,
    chainId: chainId,
    verbose: false
})

ObservableAccounts = observableAccounts;
ObservableAccounts.init();