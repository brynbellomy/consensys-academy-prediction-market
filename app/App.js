import * as React from 'react'
import * as contracts from './contracts'
import AccountsList from './AccountsList'
import QuestionsList from './QuestionsList'
import QuestionsForm from './QuestionsForm'

require('./App.css')

class App extends React.Component
{
    constructor(props) {
        super(props)
        this.onClickMineBlock = this.onClickMineBlock.bind(this)
    }

    render() {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-6">
                        <AccountsList
                            accounts={this.props.appState.accounts}
                            currentAccount={this.props.appState.currentAccount}
                            isAdmin={this.props.appState.isAdmin}
                            isTrustedSource={this.props.appState.isTrustedSource}
                        />
                    </div>
                    <div className="col-md-6">
                        <div style={{ paddingTop: 50 }}>
                            Current block: <strong>{this.props.appState.blockNumber}</strong>
                        </div>
                        <div>
                            ETH balance: {web3.fromWei(this.props.appState.ethBalances[ this.props.appState.currentAccount ], 'ether').toString()}
                        </div>
                        <div>
                            <input ref={x => this._inputWaitUntilBlock = x} />
                            <button onClick={this.onClickMineBlock}>Wait until block</button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <QuestionsList
                            questionAddresses={this.props.appState.questionAddresses}
                            questions={this.props.appState.questions}
                            blockNumber={this.props.appState.blockNumber}
                            currentAccount={this.props.appState.currentAccount}
                            isTrustedSource={this.props.appState.isTrustedSource}
                            isAdmin={this.props.appState.isAdmin}
                            questionVotes={this.props.appState.questionVotes}
                            questionBets={this.props.appState.questionBets}
                        />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6">
                        {this.props.appState.isAdmin[ this.props.appState.currentAccount ] &&
                            <QuestionsForm currentAccount={this.props.appState.currentAccount} />
                        }
                    </div>
                </div>
            </div>
        )
    }

    onClickMineBlock() {
        let blockNum = parseInt(this._inputWaitUntilBlock.value, 10)
        contracts.tempo.waitUntilBlock(0, blockNum)
    }
}

export default App