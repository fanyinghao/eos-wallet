Eos = require('eosjs')
const {observableAccounts} = require('./observableAccounts')


chain = {
    mainnet: {
        httpEndpoint: 'https://node1.zbeos.com',
        chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
        transactionMonitor: 'https://eosmonitor.io/txns'
    },
    testnet: { 
        // httpEndpoint: 'http://192.168.2.192:10053',
        httpEndpoint: 'https://api-kylin.eosasia.one',
        chainId: '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191',
        transactionMonitor: 'https://tools.cryptokylin.io/#/tx'
    }
}

let node = chain.testnet;

httpEndpoint = node.httpEndpoint;
transactionMonitor = node.transactionMonitor
chainId = node.chainId

eos = Eos({
    httpEndpoint: httpEndpoint,
    chainId: chainId,
    verbose: false
})

ObservableAccounts = observableAccounts;
ObservableAccounts.init();