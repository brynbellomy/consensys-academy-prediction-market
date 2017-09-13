pragma solidity ^0.4.15;

import './SafeMath.sol';
import './Ownable.sol';
import './Haltable.sol';
import './Interfaces.sol';


contract BinaryQuestion is Haltable, Ownable
{
    using SafeMath for uint;

    enum Vote { None, Yes, No }

    struct Bet {
        address bettor;
        Vote vote;
        uint amount;
        bool withdrawn;
    }

    uint public voteDeadlineBlock;
    uint public betDeadlineBlock;
    uint public yesVotes;
    uint public noVotes;
    uint public yesFunds;
    uint public noFunds;

    mapping(address => Bet) public bets;
    mapping(address => Vote) public votes;

    event LogBet(address bettor, Vote vote, uint betAmount);
    event LogVote(address trustedSource, Vote vote);
    event LogWithdraw(address who, uint amount);

    function BinaryQuestion(uint _betDeadlineBlock, uint _voteDeadlineBlock) {
        betDeadlineBlock = _betDeadlineBlock;
        voteDeadlineBlock = _voteDeadlineBlock;
    }

    function haltSwitch(address _who, bool _isHalted)
        onlyAdmin
        returns (bool ok)
    {
        return _haltSwitch(_who, _isHalted);
    }

    // due to our multi-admin setup, it's probably useful to be able to specify the recipient
    // of the destroyed contract's funds.
    function kill(address recipient)
        onlyAdmin
        onlyHalted
        returns (bool ok)
    {
        selfdestruct(recipient);
        return true;
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

        bets[msg.sender].bettor = msg.sender;
        bets[msg.sender].vote = betVote;
        bets[msg.sender].amount = bets[msg.sender].amount.safeAdd(msg.value);

        LogBet(msg.sender, betVote, msg.value);

        return true;
    }

    // this method is intended to be called by contracts inheriting from BinaryQuestion, hence why
    // it's marked `internal`.  this helps us account for the different ways of "voting" on a question
    // (human trusted sources, an oracle, etc.)
    function vote(address voter, bool yesOrNo)
        internal
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

    // onlyAdmin calls back to the PredictionMarket contract that spawned this question to ensure
    // that msg.sender is an admin.  it's much easier and cheaper to centralize storage of our
    // list of admins.
    modifier onlyAdmin {
        IPredictionMarket mkt = IPredictionMarket(owner);
        require(mkt.isAdmin(msg.sender));
        _;
    }
}
