pragma solidity ^0.4.15;

import './Question.sol';
import './Haltable.sol';
import './MultiOwnable.sol';


contract PredictionMarket is MultiOwnable, Haltable
{
    mapping(address => bool) public isTrustedSource;

    mapping(bytes32 => bool) public questionHasBeenAsked;
    mapping(address => bool) questionAddrExists;
    address[] public questions;

    event LogAddTrustedSource(address whoAdded, address trustedSource);
    event LogAddQuestion(address whoAdded, address questionAddress, string questionStr, uint betDeadlineBlock, uint voteDeadlineBlock);
    event LogHaltSwitch(address who, bool isHalted);

    function PredictionMarket() {
        isAdmin[msg.sender] = true;
    }

    function haltSwitch(bool _isHalted)
        onlyAdmin
        returns (bool ok)
    {
        return _haltSwitch(msg.sender, _isHalted);
    }

    function questionHaltSwitch(address _questionAddr, bool _isHalted)
        onlyAdmin
        returns (bool ok)
    {
        Question question = Question(_questionAddr);
        return question.haltSwitch(msg.sender, _isHalted);
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
        onlyNotHalted
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

    // we don't check isHalted here because the Question contracts are independently haltable and
    // this method only passes through PredictionMarket so that we can do access checking
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

    modifier onlyTrustedSource {
        require(isTrustedSource[msg.sender]);
        _;
    }
}

