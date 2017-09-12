
import * as React from 'react'
import * as contracts from './contracts'


class QuestionsList extends React.Component
{
    constructor(props) {
        super(props)
        this.onClickVote = this.onClickVote.bind(this)
        this.onClickBet = this.onClickBet.bind(this)
    }

    render() {
        return (
            <div>
                <h3>Questions</h3>

                <table className="table table-striped table-hover">
                    <thead className="thead-default">
                        <tr>
                            <th>Question</th>
                            <th>Bet deadline block</th>
                            <th>Vote deadline block</th>
                            <th>Yes votes</th>
                            <th>No votes</th>
                            <th>Yes funds</th>
                            <th>No funds</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.props.questionAddresses.map(address => {
                            const question = this.props.questions[address]
                            const questionVote = (this.props.questionVotes[ question.address ] || {})[ this.props.currentAccount ] || 0
                            const questionBet = (this.props.questionBets[ question.address ] || {})[ this.props.currentAccount ] || {}
                            return (
                                <tr key={question.address}>
                                    <td>{question.questionStr}</td>
                                    <td>{question.betDeadlineBlock.toString()}</td>
                                    <td>{question.voteDeadlineBlock.toString()}</td>
                                    <td>{question.yesVotes.toString()}</td>
                                    <td>{question.noVotes.toString()}</td>
                                    <td>{web3.fromWei(question.yesFunds, 'ether').toString()} ETH</td>
                                    <td>{web3.fromWei(question.noFunds, 'ether').toString()} ETH</td>
                                    <td>
                                        {this.props.blockNumber < question.betDeadlineBlock &&
                                            <div>
                                                <input ref={x => this._inputBidAmount = x} type="text" placeholder="ETH amount" />
                                                <button onClick={() => this.onClickBet(question.address, true)}>Bet yes</button>
                                                <button onClick={() => this.onClickBet(question.address, false)}>Bet no</button>
                                            </div>
                                        }
                                        {this.props.blockNumber >= question.betDeadlineBlock &&
                                         this.props.blockNumber < question.voteDeadlineBlock &&
                                         this.props.isTrustedSource[ this.props.currentAccount ] &&
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
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
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
        const predictionMkt = await contracts.PredictionMarket.deployed()
        let tx = await predictionMkt.vote(questionAddr, yesOrNo, {from: this.props.currentAccount, gas: 1e6})
        console.log('TX RESP ~>', tx)
    }

    async onClickWithdraw(questionAddr) {
        const question = await contracts.Question.at(questionAddr)
        let tx = await question.withdraw({from: this.props.currentAccount, gas: 1e6})
        console.log('withdraw TX RESP ~>', tx)
    }
}

export default QuestionsList