pragma solidity ^0.5;

contract IOracle { 
        function current(bytes32 key) public view returns (uint);
}
