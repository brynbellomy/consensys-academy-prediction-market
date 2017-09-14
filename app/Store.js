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

        this.questionWatchers = {}

        // define initial state
        this.state = {
            blockNumber: 0,
            currentAccount: null,
            accounts: [],
            ethBalances: {},
            isAdmin: {},
            isTrustedSource: {},
            questionAddresses: [],
            questions: {},
            questionBets: {},
            questionVotes: {},
        }

        // emit initial state
        this.emitState()
    }

    async init() {
        var currentBlock = await web3.eth.getBlockNumberPromise()
        web3.eth.defaultBlock = web3.fromDecimal(currentBlock)

        // initialize our app data
        await this.getAccounts()
        await this.setCurrentAccount(this.state.accounts[0])
        await this.getIsAdmin(this.state.accounts)
        await this.getETHBalances(this.state.accounts)

        await this.getQuestions()
        await this.getIsTrustedSource(this.state.questionAddresses, this.state.accounts)
        for (let addr of this.state.questionAddresses) {
            await this.getQuestionBets(addr, this.state.accounts)
            await this.getQuestionVotes(addr, this.state.accounts)
        }

        web3.eth.defaultBlock = 'latest'

        setInterval(store.getBlockNumber, 1000)

        const predictionMkt = await this.contracts.PredictionMarket.deployed()

        // event LogAddAdmin(address whoAdded, address newAdmin);
        predictionMkt.LogAddAdmin(null, { fromBlock: currentBlock, toBlock: 'latest' }).watch((err, log) => {
            console.log('==== LogAddAdmin')
            const { whoAdded, newAdmin } = log.args
            this.state.isAdmin[newAdmin] = true
            this.getETHBalances([ whoAdded ])
            this.emitState()
        })

        // event LogAddQuestion(address whoAdded, address questionAddress, string questionStr, uint betDeadlineBlock, uint voteDeadlineBlock);
        predictionMkt.LogAddQuestion(null, { fromBlock: currentBlock, toBlock: 'latest' }).watch((err, log) => {
            console.log('==== LogAddQuestion')
            const { whoAdded, questionAddress, questionStr, betDeadlineBlock, voteDeadlineBlock } = log.args
            this.state.questions[questionAddress] = {
                address: questionAddress,
                exists: true,
                questionStr,
                betDeadlineBlock,
                voteDeadlineBlock,
                yesVotes: 0,
                noVotes: 0,
                yesFunds: 0,
                noFunds: 0,
            }
            this.state.questionAddresses = _.uniq( [].concat(this.state.questionAddresses, questionAddress) )
            this.getETHBalances([ whoAdded ])
            this.emitState()

            this.addQuestionWatchers(questionAddress)
        })
    }

    async addQuestionWatchers(questionAddr, currentBlock) {
        if (this.questionWatchers[questionAddr] !== undefined) {
            return
        }

        const questionContract = await this.contracts.Question.at(questionAddr)

        // event LogVote(address trustedSource, Vote vote);
        questionContract.LogVote(null, { fromBlock: 0, toBlock: 'latest' }).watch((err, log) => {
            console.log('==== LogVote')
            const { trustedSource, vote } = log.args
            this.getQuestions([ questionAddr ])
            this.getQuestionVotes(questionAddr, [ trustedSource ])
            this.getETHBalances([ trustedSource ])
        })

        // event LogBet(address bettor, Vote vote, uint betAmount);
        questionContract.LogBet(null, { fromBlock: 0, toBlock: 'latest' }).watch((err, log) => {
            console.log('==== LogBet')
            const { bettor, vote, betAmount } = log.args
            this.getQuestions([ questionAddr ])
            this.getQuestionBets(questionAddr, [ bettor ])
            this.getETHBalances([ bettor ])
        })

        // event LogWithdraw(address who, uint amount);
        questionContract.LogWithdraw(null, { fromBlock: 0, toBlock: 'latest' }).watch((err, log) => {
            console.log('==== LogWithdraw')
            const { who, amount } = log.args
            this.state.questionBets[questionAddr] = this.state.questionBets[questionAddr] || {}
            this.state.questionBets[questionAddr][who] = this.state.questionBets[questionAddr][who] || {}
            this.state.questionBets[questionAddr][who].withdrawn = true
            this.getETHBalances([ who ])
            this.emitState()
        })

        // event LogAddTrustedSource(address whoAdded, address trustedSource);
        questionContract.LogAddTrustedSource(null, { fromBlock: 0, toBlock: 'latest' }).watch((err, log) => {
            console.log('==== LogAddTrustedSource')
            const { whoAdded, trustedSource } = log.args
            this.state.isTrustedSource[questionAddr] = this.state.isTrustedSource[questionAddr] || {}
            this.state.isTrustedSource[questionAddr][trustedSource] = true
            this.getETHBalances([ whoAdded ])
            this.emitState()
        })

        this.questionWatchers[questionAddr] = true
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

    async getQuestions(questionAddresses) {
        const predictionMkt = await this.contracts.PredictionMarket.deployed()

        if (questionAddresses === null || questionAddresses === undefined) {
            questionAddresses = await predictionMkt.getAllQuestionAddresses({ from: this.state.currentAccount })
        }

        const questionPromises = questionAddresses.map(addr => {
            return this.contracts.Question.at(addr).then(instance => instance.getMetadata({ from: this.state.currentAccount }))
        })

        const questions = (await Promise.all(questionPromises)).map(data.questionTupleToObject)
        _.zip(questionAddresses, questions).map(pair => {
            const [ address, question ] = pair
            return { address, ...question }
        }).forEach(question => {
            this.state.questions[question.address] = question
        })

        this.state.questionAddresses = _.uniq( [].concat(this.state.questionAddresses, questionAddresses) )

        for (let addr of questionAddresses) {
            await this.addQuestionWatchers(addr)
        }

        this.emitState()
    }

    async getAccounts() {
        const accounts = await this.web3.eth.getAccountsPromise()
        this.state.accounts = accounts
        this.emitState()
    }

    async getIsAdmin(accounts) {
        const predictionMkt = await this.contracts.PredictionMarket.deployed()

        const results = await Promise.all( accounts.map(acct => predictionMkt.isAdmin(acct, {from: this.state.currentAccount})) )
        _.zip(accounts, results).forEach(tpl => {
            const [ acct, is ] = tpl
            this.state.isAdmin[acct] = is
        })

        this.emitState()
    }

    async getIsTrustedSource(questions, accounts) {
        const predictionMkt = await this.contracts.PredictionMarket.deployed()

        for (let questionAddr of questions) {
            this.state.isTrustedSource[questionAddr] = this.state.isTrustedSource[questionAddr] || {}

            const question = await this.contracts.Question.at(questionAddr)

            const results = await Promise.all( accounts.map(acct => question.isTrustedSource(acct)) )
            _.zip(accounts, results).forEach(tpl => {
                const [ acct, is ] = tpl
                this.state.isTrustedSource[questionAddr][acct] = is
            })
        }

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

    async getQuestionBets(questionAddr, accounts) {
        const question = await this.contracts.Question.at(questionAddr)

        for (let account of accounts) {
            const [ bettor, vote, amount, withdrawn ] = await question.bets(account, {from: this.state.currentAccount})
            this.state.questionBets[questionAddr] = this.state.questionBets[questionAddr] || {}
            this.state.questionBets[questionAddr][account] = { vote: vote.toNumber(), amount, withdrawn }
        }

        this.emitState()
    }

    async getQuestionVotes(questionAddr, accounts) {
        const question = await this.contracts.Question.at(questionAddr)

        for (let account of accounts) {
            const vote = await question.votes(account, {from: this.state.currentAccount})
            this.state.questionVotes[questionAddr] = this.state.questionVotes[questionAddr] || {}
            this.state.questionVotes[questionAddr][account] = vote.toNumber()
        }

        this.emitState()
    }
}

export default Store