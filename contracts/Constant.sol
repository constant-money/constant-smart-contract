pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import './Admin.sol';
import './IOracle.sol';
import './IMonetaryPolicy.sol';

contract Constant is ERC20, Admin { 

        // token info
        string public constant name = "Constant Stablecoin"; 
        string public constant symbol = "CONST"; 
        uint public constant decimals = 2;

        enum LoanState {Open, Closed, Liquidated}

        struct Asset {
                uint amount;
                uint price;
                uint threshold; // for automatic liquidation
        }

        struct Loan {
                uint principal;
                uint interest;
                uint since;
                Asset collateral;
                address borrower;
                LoanState state;
        }

        Loan[] private loans;

        // interface to external contracts
        IMonetaryPolicy private monetary;
        IOracle private oracle;


        // events to track onchain-offchain relationships
        event __transferByAdmin(bytes32 offchain);
        event __purchase(bytes32 offchain);
        event __redeem(bytes32 offchain);
        event __borrow(uint lid, bytes32 offchain);
        event __payoff(bytes32 offchain);
        event __liquidate(bytes32 offchain);


        constructor(address _monetary, address _oracle) public {
                monetary = IMonetaryPolicy(_monetary);
                oracle = IOracle(_oracle);
        }


        /**
         * @dev function to transfer CONST
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


        /**
         * @dev function to extend a secured loan
         */
        function borrow(bytes32 offchain) public payable {
                Loan memory l;
                uint ethPrice = oracle.value("ethPrice");
                l.principal = (msg.value * ethPrice * monetary.param("ethRatio")) / 100;
                l.interest = monetary.param("ethInterest");
                l.collateral = Asset(msg.value, ethPrice, monetary.param("ethThreshold"));
                l.since = now;
                l.borrower = msg.sender;
                l.state = LoanState.Open;

                loans.push(l);
                _mint(msg.sender, l.principal);

                emit __borrow(loans.length - 1, offchain); // catch this event
        }


        /**
         * @dev function to pay off a secured loan
         * @param lid the loan id
         */
        function payoff(uint lid, bytes32 offchain) public {
                Loan storage l = loans[lid];

                require(l.state == LoanState.Open);
                require(msg.sender == l.borrower);

                l.state = LoanState.Closed;
                _transfer(msg.sender, this, l.principal * (1 + l.interest * (now - l.since)));
                _burn(this, l.principal);
                msg.sender.transfer(l.collateral.amount);

                emit __payoff(offchain);
        }


        /**
         * @dev function to handle automatic liquidation 
         * @param lid the loan id
         */
        function liquidate(uint lid, bytes32 offchain) public onlyAdmin {
                Loan storage l = loans[lid];

                require(l.state == LoanState.Open);
                require(oracle.value("ethPrice") < l.collateral.price * l.collateral.threshold);

                l.state = LoanState.Liquidated;
                admin.transfer(l.collateral.amount);

                emit __liquidate(offchain);
        }
}
