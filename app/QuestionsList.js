
import * as React from 'react'
import * as contracts from './contracts'
import classnames from 'classnames'
import AddTrustedSourceForm from './AddTrustedSourceForm'


class QuestionsList extends React.Component
{
    constructor(props) {
        super(props)
        this.onClickVote = this.onClickVote.bind(this)
        this.onClickBet = this.onClickBet.bind(this)
    }

    render() {
        return (
            <div className="component-QuestionsList">
                {this.props.questionAddresses.map(address => {
                    const question = this.props.questions[address]
                    const questionVote = (this.props.questionVotes[ question.address ] || {})[ this.props.currentAccount ] || 0
                    const questionBet = (this.props.questionBets[ question.address ] || {})[ this.props.currentAccount ] || {}
                    const isAdmin = this.props.isAdmin[ this.props.currentAccount ]

                    return (
                        <div className="question card row" key={question.address}>
                            <h3>{question.questionStr}</h3>

                            <div className={classnames('question-data', isAdmin ? 'col-md-6' : 'col-md-12')}>
                                <div><strong>Bet deadline block:</strong> {question.betDeadlineBlock.toString()}</div>
                                <div><strong>Vote deadline block:</strong> {question.voteDeadlineBlock.toString()}</div>
                                <div><strong>Yes votes:</strong> {question.yesVotes.toString()}</div>
                                <div><strong>No votes:</strong> {question.noVotes.toString()}</div>
                                <div><strong>Yes funds:</strong> {web3.fromWei(question.yesFunds, 'ether').toString()} ETH</div>
                                <div><strong>No funds:</strong> {web3.fromWei(question.noFunds, 'ether').toString()} ETH</div>
                                <div>
                                    {this.props.blockNumber < question.betDeadlineBlock &&
                                        <div>
                                            <input ref={x => this._inputBidAmount = x} type="text" placeholder="ETH amount" />
                                            <button onClick={() => this.onClickBet(question.address, true)}>Bet yes</button>
                                            <button onClick={() => this.onClickBet(question.address, false)}>Bet no</button>
                                        </div>
                                    }
                                    {this.props.blockNumber >= question.betDeadlineBlock &&
                                     this.props.blockNumber < question.voteDeadlineBlock &&
                                     (this.props.isTrustedSource[question.address] || {})[ this.props.currentAccount ] &&
                                     questionVote === 0 &&
                                        <div>
                                            <button onClick={() => this.onClickVote(question.address, true)}>Vote yes</button>
                                            <button onClick={() => this.onClickVote(question.address, false)}>Vote no</button>
                                        </div>
                                    }
                                    {this.props.blockNumber >= question.voteDeadlineBlock &&
                                     questionBet.withdrawn !== true &&
                                     questionBet.amount.greaterThan(0) &&
                                     (questionBet.vote === (question.yesVotes.greaterThan(question.noVotes) ? 1 : 2)
                                        || question.yesVotes.equals( question.noVotes ) ) &&
                                        <div>
                                            <button onClick={() => this.onClickWithdraw(question.address)}>Withdraw</button>
                                        </div>
                                    }
                                </div>
                            </div>

                            {isAdmin &&
                                <AddTrustedSourceForm
                                    className="col-md-6"
                                    currentAccount={this.props.currentAccount}
                                    questionAddress={question.address}
                                />
                            }
                        </div>
                    )
                })}
            </div>
        )
    }

    async onClickBet(questionAddr, yesOrNo) {
        const betAmount = web3.toWei(parseFloat(this._inputBidAmount.value), 'ether')

        const question = await contracts.Question.at(questionAddr)
        let tx = await question.bet(yesOrNo, {from: this.props.currentAccount, value: betAmount, gas: 1e6})
        console.log('TX RESP ~>', tx)
    }

    async onClickVote(questionAddr, yesOrNo) {
        const question = await contracts.Question.at(questionAddr)
        let tx = await question.vote(yesOrNo, {from: this.props.currentAccount, gas: 1e6})
        console.log('TX RESP ~>', tx)
    }

    async onClickWithdraw(questionAddr) {
        const question = await contracts.Question.at(questionAddr)
        let tx = await question.withdraw({from: this.props.currentAccount, gas: 1e6})
        console.log('withdraw TX RESP ~>', tx)
    }
}

export default QuestionsList