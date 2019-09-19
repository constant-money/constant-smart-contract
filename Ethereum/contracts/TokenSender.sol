pragma solidity ^0.5;

import './Admin.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract TokenSender is Admin {

        // events to track onchain-offchain relationships
        event __erc20TokenSend(bytes32 offchain);

         function erc20TokenSend(address tokenAddress, address recipient, uint256 tokenAmount, bytes32 offchain) public onlyAdmin {
                ERC20(tokenAddress).transfer(recipient, tokenAmount);
                emit __erc20TokenSend(offchain);

            }

}
