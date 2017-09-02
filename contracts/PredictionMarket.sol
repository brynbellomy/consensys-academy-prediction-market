pragma solidity ^0.4.15;

import './SafeMath.sol';

contract PredictionMarket
{
    using SafeMath for uint;

    enum Vote { None, Yes, No }

    struct Bet {
        address bettor;
        Vote vote;
        uint amount;
        bool withdrawn;
    }

    struct Question {
        bool exists;

        string question;
        uint betDeadlineBlock;
        uint voteDeadlineBlock;

        uint yesVotes;
        uint noVotes;
        uint yesFunds;
        uint noFunds;

        mapping(address => Bet) bets;
        mapping(address => Vote) votes;
    }

    mapping(address => bool) public isAdmin;
    mapping(address => bool) public isTrustedSource;

    mapping(bytes32 => Question) public questionsByID;
    bytes32[] public questionIDs;

    event LogAddAdmin(address whoAdded, address newAdmin);
    event LogAddQuestion(address whoAdded, bytes32 questionID, string question, uint betDeadlineBlock, uint voteDeadlineBlock);
    event LogAddTrustedSource(address whoAdded, address trustedSource);
    event LogBet(address bettor, bytes32 questionID, Vote vote, uint betAmount);
    event LogVote(address trustedSource, bytes32 questionID, Vote vote);
    event LogWithdraw(address who, bytes32 questionID, uint amount);

    function PredictionMarket() {
        // @@TODO: test this value
        isAdmin[msg.sender] = true;
    }

    // @@TODO: test this function
    function numQuestions()
        constant
        returns (uint)
    {
        return questionIDs.length;
    }

    function getAllQuestionIDs()
        constant
        returns (bytes32[])
    {
        return questionIDs;
    }

    // @@TODO: test this function
    function addAdmin(address admin)
        onlyAdmin
        returns (bool ok)
    {
        require(isAdmin[admin] == false);
        isAdmin[admin] = true;

        LogAddAdmin(msg.sender, admin);
        return true;
    }

    function addTrustedSource(address source)
        onlyAdmin
        returns (bool ok)
    {
        require(isTrustedSource[source] == false);

        isTrustedSource[source] = true;

        LogAddTrustedSource(msg.sender, source);
        return true;
    }

    function addQuestion(string question, uint betDeadlineBlock, uint voteDeadlineBlock)
        onlyAdmin
        returns (bool ok, bytes32 questionID)
    {
        require(betDeadlineBlock > block.number);
        require(voteDeadlineBlock > betDeadlineBlock);

        questionID = keccak256(question);

        require(questionsByID[questionID].exists == false);

        questionsByID[questionID] = Question({
            question: question,
            betDeadlineBlock: betDeadlineBlock,
            voteDeadlineBlock: voteDeadlineBlock,
            exists: true,
            yesFunds: 0,
            noFunds: 0,
            yesVotes: 0,
            noVotes: 0
        });

        questionIDs.push(questionID);

        LogAddQuestion(msg.sender, questionID, question, betDeadlineBlock, voteDeadlineBlock);

        return (true, questionID);
    }

    function bet(bytes32 questionID, bool yesOrNo)
        payable
        returns (bool ok)
    {
        require(msg.value > 0);

        Question storage question = questionsByID[questionID];

        require(question.exists);
        require(block.number <= question.betDeadlineBlock);

        Vote betVote;
        if (yesOrNo == true) {
            question.yesFunds = question.yesFunds.safeAdd(msg.value);
            betVote = Vote.Yes;
        } else {
            question.noFunds = question.noFunds.safeAdd(msg.value);
            betVote = Vote.No;
        }

        question.bets[msg.sender] = Bet({
            bettor: msg.sender,
            vote: betVote,
            amount: msg.value,
            withdrawn: false
        });

        LogBet(msg.sender, questionID, betVote, msg.value);

        return true;
    }

    function vote(bytes32 questionID, bool yesOrNo)
        onlyTrustedSource
        returns (bool ok)
    {
        Question storage question = questionsByID[questionID];

        require(question.exists);
        require(block.number > question.betDeadlineBlock);
        require(block.number <= question.voteDeadlineBlock);
        require(question.votes[msg.sender] == Vote.None);

        Vote voteValue;
        if (yesOrNo == true) {
            question.yesVotes = question.yesVotes.safeAdd(1);
            voteValue = Vote.Yes;
        } else {
            question.noVotes = question.noVotes.safeAdd(1);
            voteValue = Vote.No;
        }

        question.votes[msg.sender] = voteValue;

        LogVote(msg.sender, questionID, voteValue);

        return true;
    }

    function withdraw(bytes32 questionID)
        returns (bool ok)
    {
        Question storage question = questionsByID[questionID];
        require(question.exists);
        require(block.number > question.voteDeadlineBlock);

        Bet storage theBet = question.bets[msg.sender];
        require(theBet.amount > 0);
        require(theBet.withdrawn == false);

        theBet.withdrawn = true;

        // if nobody voted, or the vote was a tie, the bettors are allowed to simply withdraw their bets
        if (question.yesVotes == question.noVotes) {
            msg.sender.transfer(theBet.amount);

            LogWithdraw(msg.sender, questionID, theBet.amount);
            return true;
        }

        uint winningVoteFunds;
        if (question.yesVotes > question.noVotes) {
            require(theBet.vote == Vote.Yes);
            winningVoteFunds = question.yesFunds;
        } else if (question.noVotes > question.yesVotes) {
            require(theBet.vote == Vote.No);
            winningVoteFunds = question.noFunds;
        }

        uint totalFunds = question.yesFunds.safeAdd(question.noFunds);
        uint withdrawAmount = totalFunds.safeMul(theBet.amount).safeDiv(winningVoteFunds);

        msg.sender.transfer(withdrawAmount);

        LogWithdraw(msg.sender, questionID, withdrawAmount);
        return true;
    }

    function getBet(bytes32 questionID, address bettor)
        public
        constant
        returns (Vote theVote, uint amount, bool withdrawn)
    {
        Question storage question = questionsByID[questionID];
        require(question.exists);

        Bet storage theBet = question.bets[bettor];
        return (theBet.vote, theBet.amount, theBet.withdrawn);
    }

    function getVote(bytes32 questionID, address trustedSource)
        public
        constant
        returns (Vote theVote)
    {
        Question storage question = questionsByID[questionID];
        require(question.exists);

        return question.votes[trustedSource];
    }

    modifier onlyAdmin {
        require(isAdmin[msg.sender]);
        _;
    }

    modifier onlyTrustedSource {
        require(isTrustedSource[msg.sender]);
        _;
    }
}

