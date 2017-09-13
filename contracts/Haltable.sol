pragma solidity ^0.4.15;

contract Haltable {
    bool public isHalted;

    event LogHaltSwitch(address who, bool halted);

    // this is prefixed with an underscore so that contracts overriding it (to add extra access
    // modifiers, etc.) don't run into TypeErrors if they need to change the function signature.
    function _haltSwitch(address _who, bool _isHalted)
        internal
        returns (bool ok)
    {
        require(isHalted != _isHalted);
        isHalted = _isHalted;
        LogHaltSwitch(_who, _isHalted);
        return true;
    }

    modifier onlyHalted {
        require(isHalted);
        _;
    }

    modifier onlyNotHalted {
        require(!isHalted);
        _;
    }
}
