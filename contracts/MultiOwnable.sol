pragma solidity ^0.4.15;

contract MultiOwnable
{
    mapping(address => bool) public isAdmin;

    event LogAddAdmin(address whoAdded, address newAdmin);

    function addAdmin(address admin)
        onlyAdmin
        returns (bool ok)
    {
        require(isAdmin[admin] == false);
        isAdmin[admin] = true;

        LogAddAdmin(msg.sender, admin);
        return true;
    }


    modifier onlyAdmin {
        require(isAdmin[msg.sender]);
        _;
    }
}
