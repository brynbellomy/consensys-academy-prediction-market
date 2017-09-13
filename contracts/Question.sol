pragma solidity ^0.4.15;

import './SafeMath.sol';
import './BinaryQuestion.sol';
import './Interfaces.sol';


contract Question is BinaryQuestion
{
    using SafeMath for uint;

    string public questionStr; // normally, we would probably store this in IPFS/Swarm
    mapping(address => bool) public isTrustedSource;

    event LogAddTrustedSource(address whoAdded, address trustedSource);

    function Question(string _questionStr, uint _betDeadlineBlock, uint _voteDeadlineBlock)
        BinaryQuestion(_betDeadlineBlock, _voteDeadlineBlock)
    {
        questionStr = _questionStr;
    }

    function addTrustedSource(address trustedSource)
        onlyAdmin
        returns (bool ok)
    {
        require(!isTrustedSource[trustedSource]);

        isTrustedSource[trustedSource] = true;

        LogAddTrustedSource(msg.sender, trustedSource);
        return true;
    }

    function vote(bool yesOrNo)
        onlyTrustedSource
        returns (bool ok)
    {
        return BinaryQuestion.vote(msg.sender, yesOrNo);
    }

    //
    // frontend convenience getters
    //

    function getMetadata()
        constant
        returns (string _questionStr, uint _betDeadlineBlock, uint _voteDeadlineBlock, uint _yesVotes, uint _noVotes, uint _yesFunds, uint _noFunds)
    {
        return (questionStr, betDeadlineBlock, voteDeadlineBlock, yesVotes, noVotes, yesFunds, noFunds);
    }

    //
    // modifiers
    //

    modifier onlyTrustedSource {
        require(isTrustedSource[msg.sender]);
        _;
    }
}