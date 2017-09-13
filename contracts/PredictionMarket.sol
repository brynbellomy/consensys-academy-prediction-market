pragma solidity ^0.4.15;

import './Question.sol';
import './Haltable.sol';
import './MultiOwnable.sol';
import './AddressSetLib.sol';

contract IKillable {
    function kill(address recipient) returns (bool ok);
}

contract PredictionMarket is MultiOwnable, Haltable
{
    using AddressSetLib for AddressSetLib.AddressSet;

    mapping(address => bool) public isTrustedSource;

    mapping(bytes32 => bool) public questionHasBeenAsked;
    AddressSetLib.AddressSet questions;

    event LogAddQuestion(address whoAdded, address questionAddress, string questionStr, uint betDeadlineBlock, uint voteDeadlineBlock);
    event LogHaltSwitch(address who, bool isHalted);

    function PredictionMarket() {
        isAdmin[msg.sender] = true;
    }

    //
    // administrative functions
    //

    function haltSwitch(bool _isHalted)
        onlyAdmin
        returns (bool ok)
    {
        return _haltSwitch(msg.sender, _isHalted);
    }

    // due to our multi-admin setup, it's probably useful to be able to specify the recipient
    // of the destroyed contract's funds.
    function kill(address recipient)
        onlyAdmin
        returns (bool ok)
    {
        selfdestruct(recipient);
        return true;
    }

    function killQuestion(address _questionAddr, address _recipient)
        onlyAdmin
        returns (bool ok)
    {
        require(questions.contains(_questionAddr));

        IKillable question = IKillable(_questionAddr);
        question.kill(_recipient);

        // remove the question from our master list
        questions.remove(_questionAddr);

        return true;
    }

    //
    // business logic
    //

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
        questions.add(address(question));

        LogAddQuestion(msg.sender, address(question), questionStr, betDeadlineBlock, voteDeadlineBlock);

        return (true, address(question));
    }

    //
    // getters for the frontend
    //

    function numQuestions()
        constant
        returns (uint)
    {
        return questions.size();
    }

    function getQuestionIndex(uint i)
        constant
        returns (address)
    {
        return questions.get(i);
    }

    function getAllQuestionAddresses()
        constant
        returns (address[])
    {
        return questions.values;
    }
}

