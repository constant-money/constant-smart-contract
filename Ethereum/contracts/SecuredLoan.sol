pragma solidity ^0.5;

import './Admin.sol';
import './ISimplePolicy.sol';
import './IOracle.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

// a factory contract of all secured loans on the CONSTant p2p lending platform
contract SecuredLoan is Admin { 

        struct Loan {
                address borrower;
                address lender;
                uint principal;
                uint rate;
                uint start;
                uint end;
                Asset collateral;
                bool open;
        }

        struct Asset {
                uint amount;
                uint price;
                uint liquidation;
        }

        Loan[] private loans;

        // interface to external contracts
        ISimplePolicy private policy;
        IOracle private oracle;
        IERC20 private CONST;

        // events to track onchain (ethereum) and offchain (our database)
        event __borrow(uint lid, bytes32 offchain);
        event __repay(bytes32 offchain);

        // TODO: ask trong what is this function for?
        function () external payable {}

        // pay gas for borrower
        function borrowByAdmin(
                address borrower, 
                address lender, 
                uint term, 
                uint rate, 
                bytes32 offchain
        ) 
                public 
                payable 
                onlyAdmin 
        {
                _borrow(borrower, lender, term, rate, offchain);
        }


        // if a borrower wants to call the contract directly
        function borrow(address lender, uint term, uint rate, bytes32 offchain) public payable {
                _borrow(msg.sender, lender, term, rate, offchain);
        }


        // take a secured loan with ETH as collateral
        function _borrow(
                address borrower,
                address lender,
                uint term, 
                uint rate, 
                bytes32 offchain
        ) 
                private
        {
                Loan memory l;

                uint ethPrice = oracle.current("ethPrice");
                l.principal = (msg.value * ethPrice * policy.current("ethLTV")) / 10000;
                l.collateral = Asset(msg.value, ethPrice, policy.current("ethLiquidation"));
                l.rate = rate;
                l.start = now;
                l.end = now + term * 1 seconds;
                l.borrower = borrower;
                l.lender = lender;
                l.open = true;

                loans.push(l);
                emit __borrow(loans.length - 1, offchain); 
        }


        // pay gas for borrower
        function repayByAdmin(address payable repayer, uint lid, bytes32 offchain) public onlyAdmin {
                _repay(repayer, lid, offchain);
        }


        // if a borrower wants to call the contract directly
        function repay(uint lid, bytes32 offchain) public {
                _repay(msg.sender, lid, offchain);
        }


        // repay a secured loan. there are 3 ways:
        // 1. borrower repays early
        // 2. borrower defaults (then anyone can repay and get the over-collateral)
        // 3. collateral current drops (then liquidation kicks in) 
        // 
        // note that the repayer must approve the contract to spend its Const first.
        function _repay(address payable repayer, uint lid, bytes32 offchain) private {
                Loan storage l = loans[lid];
                require(l.open);

                // liquidate if collateral current is approaching within 10% of principle + interest
                uint payment = l.principal * (1 + l.rate * ((now < l.end? now: l.end) - l.start));
                uint collateralValue = oracle.current("ethPrice") * l.collateral.amount;
                bool liquidated = 10000 * collateralValue < payment * (10000 + l.collateral.liquidation); 

                require(repayer == l.borrower || now > l.end || liquidated);

                CONST.transferFrom(repayer, l.lender, payment); 
                repayer.transfer(l.collateral.amount);

                l.open = false;
                emit __repay(offchain);
        }


        function loan(uint lid) public view returns (uint, uint, address, uint) {
                Loan storage l = loans[lid];
                return (l.principal, l.end, l.borrower, l.collateral.amount);
        }
}
