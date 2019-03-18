pragma solidity ^0.4.24;

contract Admin { 

        address internal admin;

        constructor() public {
                admin = msg.sender;
        }

        modifier onlyAdmin() {
                require(msg.sender == admin);
                _;
        }
}
