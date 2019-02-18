pragma solidity ^0.4.24;

contract IOracle { 
        function value(bytes32 key) public view returns (uint);
}
