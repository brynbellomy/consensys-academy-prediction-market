
import * as React from 'react'

require('./AccountsList.css')
class AccountsList extends React.Component
{
    constructor(props) {
        super(props)
        this.onClickAccount = this.onClickAccount.bind(this)
    }

    render() {
        return (
            <div className="component-AccountsList">
                <h3>Accounts</h3>

                <div>Current account: {this.props.currentAccount}</div>

                <div>
                    <small>Click an account to switch to it.</small>
                </div>

                <ul>
                    {this.props.accounts.map(account => {
                        return (
                            <li className={this.props.currentAccount == account ? 'current' : null} onClick={() => this.onClickAccount(account)} key={account}>
                                {account}
                                &nbsp;
                                {this.props.isAdmin[account] === true ? '(admin)' : null}
                                &nbsp;
                                {this.props.isTrustedSource[account] === true ? '(trusted source)' : null}
                            </li>
                        )
                    })}
                </ul>
            </div>
        )
    }

    onClickAccount(account) {
        store.setCurrentAccount(account)
    }
}

export default AccountsList