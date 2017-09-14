
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
            <div>
                <h3>Accounts</h3>

                <div>Current account: {this.props.currentAccount}</div>

                <div>
                    <small>Click an account to switch to it.</small>
                </div>

                <ul>
                    {this.props.accounts.map(account => {
                        const style = { cursor: 'pointer', fontWeight: this.props.currentAccount == account ? 'bold' : 'normal' }
                        return (
                            <li style={style} onClick={() => this.onClickAccount(account)} key={account}>
                                {account}
                                &nbsp;
                                {this.props.isAdmin[account] === true ? '(admin)' : null}
                                {/*&nbsp;
                                {this.props.isTrustedSource[account] === true ? '(trusted source)' : null}*/}
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