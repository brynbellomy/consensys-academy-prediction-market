
import { default as contract } from 'truffle-contract'

import predictionMarketArtifacts from '../build/contracts/PredictionMarket.json'
const PredictionMarket = contract(predictionMarketArtifacts)

import questionArtifacts from '../build/contracts/Question.json'
const Question = contract(questionArtifacts)

let _tempo = require('@digix/tempo')
let tempo = {}

function attachWeb3(web3) {
    PredictionMarket.setProvider(web3.currentProvider)
    Question.setProvider(web3.currentProvider)

    window.contracts = {
        PredictionMarket,
        Question,
    }

    let { wait, waitUntilBlock } = _tempo(web3)
    tempo.wait = wait
    tempo.waitUntilBlock = waitUntilBlock
}

export {
    attachWeb3,
    PredictionMarket,
    Question,
    tempo,
}