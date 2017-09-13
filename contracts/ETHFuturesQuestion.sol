pragma solidity ^0.4.15;

import './SafeMath.sol';
import './BinaryQuestion.sol';
import './oraclizeAPI.sol';


contract ETHFuturesQuestion is BinaryQuestion, usingOraclize
{
    using SafeMath for uint;

    uint public targetUSDPrice;
    uint public finalUSDPrice; // this is provided so that users know what the outcome was
    bool public finalized;

    function ETHFuturesQuestion(uint _targetUSDPrice, uint _betDeadlineBlock, uint _voteDeadlineBlock)
        BinaryQuestion(_betDeadlineBlock, _voteDeadlineBlock)
    {
        targetUSDPrice = _targetUSDPrice;
    }

    function finalize()
        payable
        onlyAdmin
    {
        require(!finalized);
        require(oraclize_getPrice("URL") < msg.value);

        finalized = true;

        oraclize_query("URL", "json(https://api.kraken.com/0/public/Ticker?pair=ETHUSD).result.XETHZUSD.c.0");
    }

    function __callback(bytes32 requestId, string result) {
        require(msg.sender == oraclize_cbAddress());
        oraclizeCallback(requestId, result);
    }

    function __callback(bytes32 requestId, string result, bytes proof) {
        require(msg.sender == oraclize_cbAddress());
        oraclizeCallback(requestId, result);
    }

    function oraclizeCallback(bytes32 requestId, string result)
        private
    {
        finalUSDPrice = stringToUint(result);

        if (finalUSDPrice > targetUSDPrice) {
            BinaryQuestion.vote(oraclize_cbAddress(), true);
        } else if (finalUSDPrice < targetUSDPrice) {
            BinaryQuestion.vote(oraclize_cbAddress(), false);
        } else {
            // no-op — if the market price is identical to the targetUSDPrice, everyone just gets to
            // withdraw their bets (after all, it's a binary prediction market)
        }
    }

    //
    // frontend convenience getters
    //

    function getMetadata()
        constant
        returns (uint _targetUSDPrice, uint _betDeadlineBlock, uint _voteDeadlineBlock, uint _yesVotes, uint _noVotes, uint _yesFunds, uint _noFunds)
    {
        return (targetUSDPrice, betDeadlineBlock, voteDeadlineBlock, yesVotes, noVotes, yesFunds, noFunds);
    }

    //
    // utils
    //

    function stringToUint(string s)
        constant
        returns (uint result)
    {
        bytes memory b = bytes(s);
        result = 0;
        for (uint i = 0; i < b.length; i++) {
            uint c = uint(b[i]);
            if (c >= 48 && c <= 57) {
                result = result.safeMul(10).safeAdd(c.safeSub(48));
            } else {
                if (c == 46) {
                    break;
                }
            }
        }
    }
}