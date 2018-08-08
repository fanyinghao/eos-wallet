chain = {
    mainnet: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    testnet: '038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca',
    sysnet: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f'
}

sessionConfig = {
    timeoutInMin: 30,
    uriRules: {
        'owner': '/account_recovery',
        'active': '/(transfer|contracts)',
        'active/**': '/producers'
    }
}

keystore = kos.Keystore('myaccount', sessionConfig)

eos = Eos({
    httpEndpoint: 'http://192.168.2.192:10053',
    chainId: chain.testnet,
    verbose: true,
    keyProvider: keystore.keyProvider
})