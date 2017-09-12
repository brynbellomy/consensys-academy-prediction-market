pragma solidity ^0.4.15;

import './SafeMath.sol';
import './Ownable.sol';
import './Haltable.sol';

contract Question is Ownable, Haltable
{
    using SafeMath for uint;

    enum Vote { None, Yes, No }

    struct Bet {
        address bettor;
        Vote vote;
        uint amount;
        bool withdrawn;
    }

    string public questionStr;
    uint public betDeadlineBlock;
    uint public voteDeadlineBlock;

    uint public yesVotes;
    uint public noVotes;
    uint public yesFunds;
    uint public noFunds;

    mapping(address => Bet) public bets;
    mapping(address => Vote) public votes;

    event LogBet(address bettor, Vote vote, uint betAmount);
    event LogVote(address trustedSource, Vote vote);
    event LogWithdraw(address who, uint amount);

    function Question(string _questionStr, uint _betDeadlineBlock, uint _voteDeadlineBlock) {
        questionStr = _questionStr;
        betDeadlineBlock = _betDeadlineBlock;
        voteDeadlineBlock = _voteDeadlineBlock;
    }

    function haltSwitch(address _who, bool _isHalted)
        onlyOwner
        returns (bool ok)
    {
        return _haltSwitch(_who, _isHalted);
    }

    function bet(bool yesOrNo)
        payable
        returns (bool ok)
    {
        require(msg.value > 0);
        require(block.number <= betDeadlineBlock);

        Vote betVote;
        if (yesOrNo == true) {
            yesFunds = yesFunds.safeAdd(msg.value);
            betVote = Vote.Yes;
        } else {
            noFunds = noFunds.safeAdd(msg.value);
            betVote = Vote.No;
        }

        bets[msg.sender] = Bet({
            bettor: msg.sender,
            vote: betVote,
            amount: msg.value,
            withdrawn: false
        });

        LogBet(msg.sender, betVote, msg.value);

        return true;
    }

    // the vote() method gets proxied through PredictionMarket so that we can do access
    // checking there instead of having to add trusted sources for each question.
    function vote(address voter, bool yesOrNo)
        onlyOwner
        returns (bool ok)
    {
        require(block.number > betDeadlineBlock);
        require(block.number <= voteDeadlineBlock);
        require(votes[voter] == Vote.None);

        Vote voteValue;
        if (yesOrNo == true) {
            yesVotes = yesVotes.safeAdd(1);
            voteValue = Vote.Yes;
        } else {
            noVotes = noVotes.safeAdd(1);
            voteValue = Vote.No;
        }

        votes[voter] = voteValue;

        LogVote(voter, voteValue);

        return true;
    }

    function withdraw()
        returns (bool ok)
    {
        require(block.number > voteDeadlineBlock);

        Bet storage theBet = bets[msg.sender];
        require(theBet.amount > 0);
        require(theBet.withdrawn == false);

        theBet.withdrawn = true;

        // if nobody voted, or the vote was a tie, the bettors are allowed to simply withdraw their bets
        if (yesVotes == noVotes) {
            msg.sender.transfer(theBet.amount);

            LogWithdraw(msg.sender, theBet.amount);
            return true;
        }

        uint winningVoteFunds;
        if (yesVotes > noVotes) {
            require(theBet.vote == Vote.Yes);
            winningVoteFunds = yesFunds;
        } else if (noVotes > yesVotes) {
            require(theBet.vote == Vote.No);
            winningVoteFunds = noFunds;
        }

        uint totalFunds = yesFunds.safeAdd(noFunds);
        uint withdrawAmount = totalFunds.safeMul(theBet.amount).safeDiv(winningVoteFunds);

        msg.sender.transfer(withdrawAmount);

        LogWithdraw(msg.sender, withdrawAmount);
        return true;
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
}