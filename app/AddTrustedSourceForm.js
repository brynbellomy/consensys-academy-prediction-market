
import * as React from 'react'
import * as contracts from './contracts'

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
            <div className="add-trusted-source-form">
                <h3>Add trusted source</h3>

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
        let addr = this._inputAddr.value
        let predictionMkt = await contracts.PredictionMarket.deployed()
        let tx = await predictionMkt.addTrustedSource(addr, {from: this.props.currentAccount, gas: 1e6})
        console.log('TX RESP ~>', tx)
    }
}

export default AddTrustedSourceForm