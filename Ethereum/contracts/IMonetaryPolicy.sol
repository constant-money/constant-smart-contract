pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import './Admin.sol';

contract IMonetaryPolicy { 
        function param(bytes32 key) public view returns (uint);
}
