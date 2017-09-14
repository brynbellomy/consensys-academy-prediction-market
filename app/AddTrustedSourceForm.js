
import * as _ from 'lodash'
import * as React from 'react'
import * as contracts from './contracts'
import classnames from 'classnames'

class AddTrustedSourceForm extends React.Component
{
    constructor(props) {
        super(props)
        this.onClickSubmit = this.onClickSubmit.bind(this)
        this.render = this.render.bind(this)
        this._inputAddr = null
    }

    render() {
        return (
            <div className={classnames('add-trusted-source-form', this.props.className)}>
                <h4>Add trusted source</h4>

                <form>
                    <div className="form-group">
                        <label htmlFor="input-trusted-source">Address</label>
                        <input ref={x => this._inputAddr = x} type="text" className="form-control" id="input-trusted-source" placeholder="Enter the trusted source's address" />
                    </div>

                    <button onClick={this.onClickSubmit} type="submit" className="btn btn-primary">Submit</button>
                </form>
            </div>
        )
    }

    async onClickSubmit() {
        let question = await contracts.Question.at(this.props.questionAddress)
        let tx = await question.addTrustedSource(this._inputAddr.value, {from: this.props.currentAccount, gas: 1e6})
        console.log('TX RESP ~>', tx)
    }
}

export default AddTrustedSourceForm