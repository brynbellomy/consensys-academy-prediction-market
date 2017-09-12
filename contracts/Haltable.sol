pragma solidity ^0.4.15;

contract Haltable {
    bool public isHalted;

    event LogHaltSwitch(address who, bool halted);

    function _haltSwitch(address _who, bool _isHalted)
        internal
        returns (bool ok)
    {
        require(isHalted != _isHalted);
        isHalted = _isHalted;
        LogHaltSwitch(_who, _isHalted);
        return true;
    }

    modifier onlyNotHalted {
        require(!isHalted);
        _;
    }
}
