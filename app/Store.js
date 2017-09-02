import EventEmitter from 'events'
import * as data from './data'
import * as _ from 'lodash'

class Store extends EventEmitter
{
    constructor(web3, contracts) {
        super()

        // bind functions
        this.init = this.init.bind(this)
        this.emitState = this.emitState.bind(this)
        this.setCurrentAccount = this.setCurrentAccount.bind(this)
        this.addQuestion = this.addQuestion.bind(this)
        this.getQuestions = this.getQuestions.bind(this)
        this.getAccounts = this.getAccounts.bind(this)
        this.getIsAdmin = this.getIsAdmin.bind(this)
        this.getIsTrustedSource = this.getIsTrustedSource.bind(this)
        this.getETHBalances = this.getETHBalances.bind(this)
        this.getBlockNumber = this.getBlockNumber.bind(this)

        // store constructor args
        this.web3 = web3
        this.contracts = contracts

        // define initial state
        this.state = {
            blockNumber: 0,
            currentAccount: null,
            accounts: [],
            ethBalances: {},
            isAdmin: {},
            isTrustedSource: {},
            questionIDs: [],
            questions: {},
            questionBets: {},
            questionVotes: {},
        }

        // emit initial state
        this.emitState()
    }

    async init() {
        const currentBlock = await web3.eth.getBlockNumberPromise()
        web3.eth.defaultBlock = currentBlock

        // initialize our app data
        await this.getAccounts()
        await this.setCurrentAccount(this.state.accounts[0])
        await this.getIsAdmin(this.state.accounts)
        await this.getIsTrustedSource(this.state.accounts)
        await this.getETHBalances(this.state.accounts)

        await this.getQuestions()
        for (let questionID of this.state.questionIDs) {
            await this.getQuestionBets(questionID, this.state.accounts)
            await this.getQuestionVotes(questionID, this.state.accounts)
        }

        web3.eth.defaultBlock = 'latest'

        setInterval(store.getBlockNumber, 1000)

        const predictionMkt = await this.contracts.PredictionMarket.deployed()

        // event LogVote(address trustedSource, bytes32 questionID, Vote vote);
        predictionMkt.LogVote(null, { fromBlock: currentBlock, toBlock: 'latest' }).watch((err, log) => {
            console.log('==== LogVote')
            const { trustedSource, questionID, vote } = log.args
            // this.state.questionVotes[questionID] = this.state.questionVotes[questionID] || {}
            // this.state.questionVotes[questionID][trustedSource] = vote
            this.getQuestions([ questionID ])
            this.getQuestionVotes(questionID, [ trustedSource ])
            this.getETHBalances([ trustedSource ])
            // this.emitState()
        })

        // event LogBet(address bettor, bytes32 questionID, Vote vote, uint betAmount);
        predictionMkt.LogBet(null, { fromBlock: currentBlock, toBlock: 'latest' }).watch((err, log) => {
            console.log('==== LogBet')
            const { bettor, questionID, vote, betAmount } = log.args
            // this.state.questionBets[questionID] = this.state.questionBets[questionID] || {}
            // this.state.questionBets[questionID][bettor] = { vote, amount: betAmount, withdrawn: false }
            this.getQuestions([ questionID ])
            this.getQuestionBets(questionID, [ bettor ])
            this.getETHBalances([ bettor ])
            // this.emitState()
        })

        // event LogAddTrustedSource(address whoAdded, address trustedSource);
        predictionMkt.LogAddTrustedSource(null, { fromBlock: currentBlock, toBlock: 'latest' }).watch((err, log) => {
            console.log('==== LogAddTrustedSource')
            const { whoAdded, trustedSource } = log.args
            this.state.isTrustedSource[trustedSource] = true
            this.getETHBalances([ whoAdded ])
            this.emitState()
        })

        // event LogAddAdmin(address whoAdded, address newAdmin);
        predictionMkt.LogAddAdmin(null, { fromBlock: currentBlock, toBlock: 'latest' }).watch((err, log) => {
            console.log('==== LogAddAdmin')
            const { whoAdded, newAdmin } = log.args
            this.state.isAdmin[newAdmin] = true
            this.getETHBalances([ whoAdded ])
            this.emitState()
        })

        // event LogAddQuestion(address whoAdded, bytes32 questionID, string question, uint betDeadlineBlock, uint voteDeadlineBlock);
        predictionMkt.LogAddQuestion(null, { fromBlock: currentBlock, toBlock: 'latest' }).watch((err, log) => {
            console.log('==== LogAddQuestion')
            const { whoAdded, questionID, question, betDeadlineBlock, voteDeadlineBlock } = log.args
            this.state.questions[questionID] = {
                id: questionID,
                exists: true,
                question,
                betDeadlineBlock,
                voteDeadlineBlock,
                yesVotes: 0,
                noVotes: 0,
                yesFunds: 0,
                noFunds: 0,
            }
            this.state.questionIDs = _.uniq( [].concat(this.state.questionIDs, questionID) )
            this.getETHBalances([ whoAdded ])
            this.emitState()
        })

        // event LogWithdraw(address who, bytes32 questionID, uint amount);
        predictionMkt.LogWithdraw(null, { fromBlock: currentBlock, toBlock: 'latest' }).watch((err, log) => {
            console.log('==== LogWithdraw')
            const { who, questionID, amount } = log.args
            this.state.questionBets[questionID] = this.state.questionBets[questionID] || {}
            this.state.questionBets[questionID][who] = this.state.questionBets[questionID][who] || {}
            this.state.questionBets[questionID][who].withdrawn = true
            this.getETHBalances([ who ])
            this.emitState()
        })
    }

    emitState() {
        this.emit('new state', this.state)
    }

    async setCurrentAccount(account) {
        this.state.currentAccount = account
        this.emitState()
    }

    async addQuestion(question, betDeadlineBlock, voteDeadlineBlock) {
        const predictionMkt = await this.contracts.PredictionMarket.deployed()
        await predictionMkt.addQuestion(question, betDeadlineBlock, voteDeadlineBlock, { from: this.state.currentAccount, gas: 200000 })
    }

    async getQuestions(questionIDs) {
        const predictionMkt = await this.contracts.PredictionMarket.deployed()

        if (questionIDs === null || questionIDs === undefined) {
            questionIDs = await predictionMkt.getAllQuestionIDs({ from: this.state.currentAccount })
        }

        const questionPromises = questionIDs.map(id => predictionMkt.questionsByID(id, { from: this.state.currentAccount }))
        const questions = (await Promise.all(questionPromises)).map(data.questionTupleToObject)
        _.zip(questionIDs, questions).map(pair => {
            const [ id, question ] = pair
            return { id, ...question }
        }).forEach(question => {
            this.state.questions[question.id] = question
        })

        this.state.questionIDs = _.uniq( [].concat(this.state.questionIDs, questionIDs) )

        this.emitState()
    }

    async getAccounts() {
        const accounts = await this.web3.eth.getAccountsPromise()
        this.state.accounts = accounts
        this.emitState()
    }

    async getIsAdmin(accounts) {
        const predictionMkt = await this.contracts.PredictionMarket.deployed()

        const results = await Promise.all( accounts.map(acct => predictionMkt.isAdmin(acct)) )
        _.zip(accounts, results).forEach(tpl => {
            const [ acct, is ] = tpl
            this.state.isAdmin[acct] = is
        })

        this.emitState()
    }

    async getIsTrustedSource(accounts) {
        const predictionMkt = await this.contracts.PredictionMarket.deployed()

        const results = await Promise.all( accounts.map(acct => predictionMkt.isTrustedSource(acct)) )
        _.zip(accounts, results).forEach(tpl => {
            const [ acct, is ] = tpl
            this.state.isTrustedSource[acct] = is
        })

        this.emitState()
    }

    async getETHBalances(accounts) {
        const fetches = accounts.map(acct => web3.eth.getBalancePromise(acct))
        const balances = await Promise.all(fetches)
        _.zip(accounts, balances).forEach(tpl => {
            const [ acct, balance ] = tpl
            this.state.ethBalances[acct] = balance
        })
        this.emitState()
    }

    async getBlockNumber() {
        const num = await web3.eth.getBlockNumberPromise()
        this.state.blockNumber = num
        this.emitState()
    }

    async getQuestionBets(questionID, accounts) {
        const predictionMkt = await this.contracts.PredictionMarket.deployed()

        for (let account of accounts) {
            const [ vote, amount, withdrawn ] = await predictionMkt.getBet(questionID, account, {from: this.state.currentAccount})
            this.state.questionBets[questionID] = this.state.questionBets[questionID] || {}
            this.state.questionBets[questionID][account] = { vote: vote.toNumber(), amount, withdrawn }
        }

        this.emitState()
    }

    async getQuestionVotes(questionID, accounts) {
        const predictionMkt = await this.contracts.PredictionMarket.deployed()

        for (let account of accounts) {
            const vote = await predictionMkt.getVote(questionID, account, {from: this.state.currentAccount})
            this.state.questionVotes[questionID] = this.state.questionVotes[questionID] || {}
            this.state.questionVotes[questionID][account] = vote.toNumber()
        }

        this.emitState()
    }
}

export default Store