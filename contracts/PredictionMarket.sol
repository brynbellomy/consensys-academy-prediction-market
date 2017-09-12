pragma solidity ^0.4.15;

import './Question.sol';


contract PredictionMarket
{
    mapping(address => bool) public isAdmin;
    mapping(address => bool) public isTrustedSource;

    mapping(bytes32 => bool) public questionHasBeenAsked;
    mapping(address => bool) questionAddrExists;
    address[] public questions;

    event LogAddAdmin(address whoAdded, address newAdmin);
    event LogAddTrustedSource(address whoAdded, address trustedSource);
    event LogAddQuestion(address whoAdded, address questionAddress, string questionStr, uint betDeadlineBlock, uint voteDeadlineBlock);

    function PredictionMarket() {
        isAdmin[msg.sender] = true;
    }

    function addAdmin(address admin)
        onlyAdmin
        returns (bool ok)
    {
        require(isAdmin[admin] == false);
        isAdmin[admin] = true;

        LogAddAdmin(msg.sender, admin);
        return true;
    }

    function addTrustedSource(address trustedSource)
        onlyAdmin
        returns (bool ok)
    {
        require(isTrustedSource[trustedSource] == false);

        isTrustedSource[trustedSource] = true;

        LogAddTrustedSource(msg.sender, trustedSource);
        return true;
    }

    function addQuestion(string questionStr, uint betDeadlineBlock, uint voteDeadlineBlock)
        onlyAdmin
        returns (bool ok, address questionAddr)
    {
        require(betDeadlineBlock > block.number);
        require(voteDeadlineBlock > betDeadlineBlock);

        // ensure no repeated questions
        bytes32 questionID = keccak256(questionStr);
        require(questionHasBeenAsked[questionID] == false);
        questionHasBeenAsked[questionID] = true;

        // deploy the new question
        Question question = new Question(questionStr, betDeadlineBlock, voteDeadlineBlock);
        questionAddrExists[address(question)] = true;
        questions.push(address(question));

        LogAddQuestion(msg.sender, address(question), questionStr, betDeadlineBlock, voteDeadlineBlock);

        return (true, address(question));
    }

    function vote(address questionAddr, bool yesOrNo)
        onlyTrustedSource
        returns (bool ok)
    {
        require(questionAddrExists[questionAddr]);

        Question question = Question(questionAddr);
        return question.vote(msg.sender, yesOrNo);
    }


    //
    // getters for the frontend
    //

    function numQuestions()
        constant
        returns (uint)
    {
        return questions.length;
    }

    function getAllQuestionAddresses()
        constant
        returns (address[])
    {
        return questions;
    }

    //
    // modifiers
    //

    modifier onlyAdmin {
        require(isAdmin[msg.sender]);
        _;
    }

    modifier onlyTrustedSource {
        require(isTrustedSource[msg.sender]);
        _;
    }
}

