pragma solidity ^0.5;

contract Admin { 

        address private superAdmin;
        mapping(address => bool) public admin;

        constructor() public {
                superAdmin = msg.sender;
                addAdmin(msg.sender);
        }

        modifier onlyAdmin() {
                require(admin[msg.sender]);
                _;
        }

        modifier onlySuperAdmin() {
                require(msg.sender == superAdmin);
                _;
        }

        function addAdmin(address a) public onlySuperAdmin {
                require(a != address(0));
                admin[a] = true;
        }

        function removeAdmin(address a) public onlySuperAdmin {
                require(a != address(0));
                admin[a] = false;
        }
}
