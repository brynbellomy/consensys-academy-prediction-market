
import * as React from 'react'
import * as contracts from './contracts'


class QuestionsForm extends React.Component
{
    constructor(props) {
        super(props)
        this._inputQuestion = null
        this._inputBetDeadlineBlock = null
        this._inputVoteDeadlineBlock = null
        this.onClickSubmit = this.onClickSubmit.bind(this)
        this.render = this.render.bind(this)
    }

    render() {
        return (
            <div className="questions-form">
                <h3>Add question</h3>

                <form>
                    <div className="form-group">
                        <label htmlFor="input-question">Question</label>
                        <input ref={x => this._inputQuestion = x} type="text" className="form-control" id="input-question" placeholder="Enter a question" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="input-bet-deadline-block">Bet deadline block</label>
                        <input ref={x => this._inputBetDeadlineBlock = x} type="text" className="form-control" id="input-bet-deadline-block" aria-describedby="input-bet-deadline-block-desc" />
                        <small id="input-bet-deadline-block-desc" className="form-text text-muted">The last block number during which people will be allowed to bet</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="input-vote-deadline-block">Vote deadline block</label>
                        <input ref={x => this._inputVoteDeadlineBlock = x} type="text" className="form-control" id="input-vote-deadline-block" aria-describedby="input-vote-deadline-block-desc" />
                        <small id="input-vote-deadline-block-desc" className="form-text text-muted">The last block number during which people will be allowed to vote</small>
                    </div>

                    <button onClick={this.onClickSubmit} type="submit" className="btn btn-primary">Submit</button>
                </form>
            </div>
        )
    }

    async onClickSubmit() {
        const predictionMkt = await contracts.PredictionMarket.deployed()
        const question = this._inputQuestion.value
        const betDeadlineBlock = parseInt(this._inputBetDeadlineBlock.value, 10)
        const voteDeadlineBlock = parseInt(this._inputVoteDeadlineBlock.value, 10)
        let tx = await predictionMkt.addQuestion(question, betDeadlineBlock, voteDeadlineBlock, {from: this.props.currentAccount, gas: 2e6})
        console.log('TX RESP ~>', tx)

        // refresh trusted source list
        store.getIsTrustedSource(store.state.accounts)
    }
}

export default QuestionsForm