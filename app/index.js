const Promise = require('bluebird')
const Web3 = require('web3')
const React = require('react')
const ReactDOM = require('react-dom')

import * as contracts from './contracts'
import Store from './Store'
import App from './App'


window.addEventListener('load', async () => {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider)
    } else {
        console.log('No web3? You should consider trying MetaMask!')
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
    }

    if (typeof window.web3.eth.getAccountsPromise !== 'function') {
        Promise.promisifyAll(window.web3.eth, { suffix: 'Promise' })
    }

    // connect our contracts to web3
    contracts.attachWeb3(window.web3)

    // set up our store (make it available on `window` for debug purposes)
    const store = window.store = new Store(window.web3, contracts)

    // find the root element where React will render
    const root = document.getElementById('app-root')
    if (root === null || root === undefined) {
        throw new Error('#app-root not found')
    }

    // listen for state changes and re-render when we get one
    store.on('new state', state => {
        ReactDOM.render(
            <App appState={state} />
        , root)
    })

    store.init()
})

