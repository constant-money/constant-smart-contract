pragma solidity ^0.5;

import './Admin.sol';
import './ISimplePolicy.sol';
import './IOracle.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

// a factory contract of all secured loans on the constant p2p lending platform
contract SecuredLoan is Admin { 

        struct Loan {
                address borrower;
                address lender;
                uint principal;
                uint rate;
                uint start;
                uint end;
                Asset collateral;
                bool done;
        }

        struct Asset {
                uint amount;
                uint price;
                uint liquidation;
        }

        struct Open {
                address borrower;
                uint amount;
                uint collateral;
                uint rate;
                uint term;
        }

        Loan[] private loans;
        Open[] private opens;

        // interface to external contracts
        ISimplePolicy private policy;
        IOracle private oracle;
        IERC20 private CONST;

        // events to track onchain (ethereum) and offchain (our database)
        event __borrow(uint oid, bytes32 offchain);
        event __cancel(uint oid, bytes32 offchain);
        event __fill(uint lid, bytes32 offchain);
        event __repay(bytes32 offchain);

        // TODO: ask trong what is this function for?
        function () external payable {}

        // pay gas for borrower
        function borrowByAdmin(
                address borrower, 
                uint term, 
                uint rate, 
                bytes32 offchain
        ) 
                public 
                payable 
                onlyAdmin 
        {
                _borrow(borrower, term, rate, offchain);
        }


        // if a borrower wants to call the contract directly
        function borrow(
                uint term, 
                uint rate, 
                bytes32 offchain
        ) 
                public 
                payable 
        {
                _borrow(msg.sender, term, rate, offchain);
        }


        // take a secured loan with ETH as collateral
        function _borrow(
                address borrower,
                uint term, 
                uint rate, 
                bytes32 offchain
        ) 
                private
        {
                Open memory o;
                o.borrower = borrower;
                o.term = term;
                o.rate = rate;
                o.collateral = msg.value;
                opens.push(o);

                emit __borrow(opens.length - 1, offchain); 
        }


        // match an order
        function fill(
                uint oid,
                address lender,
                uint principal,
                uint term, 
                uint rate, 
                bool onchain,
                bytes32 offchain
        )       
                public 
                onlyAdmin 
        {
                Open storage o = opens[oid];

                require(principal <= o.amount);
                require(rate <= o.rate);
                require(term >= o.term);

                uint ethPrice = oracle.current("ethPrice");
                uint collateral = (principal * 10000) / (ethPrice * policy.current("ethLTV"));

                require(collateral <= o.collateral);

                o.amount -= principal;
                o.collateral -= collateral;

                Loan memory l;
                l.principal = principal;
                l.collateral = Asset(collateral, ethPrice, policy.current("ethLiquidation"));
                l.rate = rate;
                l.start = now;
                l.end = now + term * 1 seconds;
                l.lender = lender;
                loans.push(l);

                // TODO: discuss with team about this
                if (onchain) CONST.transferFrom(lender, o.borrower, l.principal); 

                emit __fill(loans.length - 1, offchain); 
        }

        // cancel an open order
        function cancel(
                uint oid,
                bytes32 offchain
        )       
                public 
        {
                Open storage o = opens[oid];

                require(msg.sender == o.borrower);
                msg.sender.transfer(o.collateral);

                emit __cancel(oid, offchain); 
        }

        // pay gas for borrower
        function repayByAdmin(
                address payable repayer, 
                uint lid, 
                bool onchain,
                bytes32 offchain
        )       
                public 
                onlyAdmin 
        {
                _repay(repayer, lid, onchain, offchain);
        }


        // if a borrower wants to call the contract directly
        function repay(
                uint lid, 
                bool onchain,
                bytes32 offchain
        ) 
                public 
        {
                _repay(msg.sender, lid, onchain, offchain);
        }


        // repay a secured loan. there are 3 ways:
        // 1. borrower repays early
        // 2. borrower defaults (then anyone can repay and get the over-collateral)
        // 3. collateral current drops (then liquidation kicks in) 
        // 
        // note that the repayer must approve the contract to spend its Const first.
        function _repay(
                address payable repayer, 
                uint lid, 
                bool onchain,
                bytes32 offchain
        ) 
                private 
        {
                Loan storage l = loans[lid];
                require(!l.done);

                // liquidate if collateral current is approaching within 10% of principle + interest
                uint payment = l.principal * (1 + l.rate * ((now < l.end? now: l.end) - l.start));
                uint collateralValue = oracle.current("ethPrice") * l.collateral.amount;
                bool liquidated = 10000 * collateralValue < payment * (10000 + l.collateral.liquidation); 

                require(repayer == l.borrower || now > l.end || liquidated);

                if (onchain) CONST.transferFrom(repayer, l.lender, payment); 
                repayer.transfer(l.collateral.amount);

                l.done = true ;
                emit __repay(offchain);
        }


        function loan(uint lid) public view returns (uint, uint, address, uint) {
                Loan storage l = loans[lid];
                return (l.principal, l.end, l.borrower, l.collateral.amount);
        }
}
