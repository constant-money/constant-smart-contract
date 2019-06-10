pragma solidity ^0.5;

import './Admin.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract Constant is ERC20, Admin {

        // token info
        string public constant name = "Constant Stablecoin";
        string public constant symbol = "CONST";
        uint public constant decimals = 2;


        // events to track onchain-offchain relationships
        event __transferByAdmin(bytes32 offchain);
        event __purchase(bytes32 offchain);
        event __redeem(bytes32 offchain);

        /**
         * @dev function to transfer CONS
         * @param from the address to transfer from
         * @param to the address to transfer to
         * @param value the amount to be transferred
         */
        function transferByAdmin(
                address from,
                address to,
                uint value,
                bytes32 offchain
        )
                public
                onlyAdmin
        {
                _transfer(from, to, value);
                emit __transferByAdmin(offchain);
        }


        /**
         * @dev function to purchase new CONST
         * @param purchaser the address that will receive the newly minted CONST
         * @param value the amount of CONST to mint
         */
        function purchase(
                address purchaser,
                uint value,
                bytes32 offchain
        )
                public
                onlyAdmin
        {
                _mint(purchaser, value);
                emit __purchase(offchain);
        }


        /**
         * @dev function to burn CONST
         * @param redeemer the account whose CONST will be burnt
         * @param value the amount of CONST to be burnt
         */
        function redeem(
                address redeemer,
                uint value,
                bytes32 offchain
        )
                public
                onlyAdmin
        {
                _burn(redeemer, value);
                emit __redeem(offchain);
        }
}
