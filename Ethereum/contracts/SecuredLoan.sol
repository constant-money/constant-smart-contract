pragma solidity ^0.5;

import './ILoanAdmin.sol';
import './ISimplePolicy.sol';
import './IOracle.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

// a factory contract of all secured loans on the constant p2p lending platform
contract SecuredLoan { 

        struct Loan {
                address payable borrower;
                address lender;
                uint256 principal;
                uint rate;
                uint start;
                uint end;
                Asset collateral;
                bool done;
        }

        struct Asset {
                uint256 amount;
                uint256 ethPrice;
                uint liquidation;
        }

        struct Open {
                address borrower;
                uint256 amount;
                uint256 collateral;
                uint rate;
                uint term;
                bool done;
        }

        uint256 private stake;

        Loan[] private loans;
        Open[] private opens;

        // interface to external contracts
        ISimplePolicy private policy;
        IOracle private oracle;
        ILoanAdmin private loanAdmin;
        IERC20 private CONST;

        // events to track onchain (ethereum) and offchain (our database)
        event __borrow(uint oid, bytes32 offchain);
        event __topupCollateral(uint oid, uint256 amount, uint256 stake, bytes32 offchain);
        event __cancel(uint oid, bytes32 offchain);
        event __fill(uint lid, bytes32 offchain);
        event __repay(uint lid, uint256 collateral, bool done, bytes32 offchain);
        event __liquidate(uint lid, bytes32 offchain);
        event __riseup(uint lid, uint256 amt, bytes32 offchain);

        event __withdraw(bytes32 offchain);
        event __payoff(uint lid, uint fee, bytes32 offchain);

        function() external payable {}


        constructor(address _policy, address _oracle, address _constant, address _admin) public {
                policy = ISimplePolicy(_policy);
                oracle = IOracle(_oracle);
                loanAdmin = ILoanAdmin(_admin);
                CONST = IERC20(_constant);
        }

        modifier onlyAdmin() {
                require(loanAdmin.isAdmin(msg.sender));
                _;
        }

        // take a secured loan with ETH as collateral
        function borrow(
                address borrower,
                uint term, 
                uint rate, 
                uint256 collateral,
                uint256 amount,
                bytes32 offchain
        ) 
                public 
                onlyAdmin
        {

                require(collateral > 0 && (address(this).balance - stake) >= collateral && address(this).balance > 0, "cannot init borrow");
                Open memory o;
                o.borrower = borrower;
                o.term = term;
                o.rate = rate;
                o.amount = amount;
                o.collateral = collateral;
                o.done = false;
                opens.push(o);
                stake = stake + collateral;

                emit __borrow(opens.length - 1, offchain); 
        }

        
        // match an order
        function fill(
                uint oid,
                address lender,
                uint256 principal,
                uint256 collateral,
                uint term, 
                uint rate, 
                bool onchain,
                bytes32 offchain
        )       
                public 
                onlyAdmin
        {
                // processing order
                Open storage o = opens[oid];

                require(principal <= o.amount, "principal not match");
                require(rate <= o.rate, "rate not match");
                require(term <= o.term, "term not match");
                require(collateral <= o.collateral, "collateral not match");

                o.amount -= principal;
                o.collateral -= collateral;

                // add a new matched loan
                Loan memory l;
                l.principal = principal;
                l.collateral = Asset(collateral, oracle.current("ethPrice"), policy.current("ethLiquidation"));
                l.rate = rate;
                l.start = now;
                l.end = now + term * 1 seconds;
                l.lender = lender;
                l.borrower = address(uint160(o.borrower));
                l.done = false;
                loans.push(l);

                // transfer money
                if (onchain) CONST.transferFrom(lender, o.borrower, l.principal); 

                emit __fill(loans.length - 1, offchain); 
        }

        // admin pay gas for user
        function topupCollateralByAdmin(
                uint oid,
                uint256 amount,
                bytes32 offchain
        )
                public
                onlyAdmin
        {
                Open storage o = opens[oid];
                _topupCollateral(oid, o.borrower, amount, offchain);
        }

        // topup an open order
        function topupCollateral(
                uint oid,
                uint256 amount,
                bytes32 offchain
        )       
                public 
        {
                _topupCollateral(oid, msg.sender, amount, offchain);
        }

        function _topupCollateral(
                uint oid,
                address borrower,
                uint256 amount,
                bytes32 offchain
        )
                private
        {
                Open storage o = opens[oid];

                require(borrower == o.borrower);
                require(!o.done && o.collateral > 0 && amount > 0 && (address(this).balance - stake) >= amount && address(this).balance > 0, "cannot init borrow");
                o.collateral +=amount;
                stake += amount;

                emit __topupCollateral(oid, amount,stake, offchain);
        }

        // admin pay gas for user
        function cancelByAdmin(
                uint oid,
                bytes32 offchain
        )
                public
                onlyAdmin
        {
                Open storage o = opens[oid];
                _cancel(oid, o.borrower, offchain);
        }

        // cancel an open order
        function cancel(
                uint oid,
                bytes32 offchain
        )       
                public 
        {
                _cancel(oid, msg.sender, offchain);
        }

        function _cancel(
                uint oid,
                address borrower,
                bytes32 offchain
        )
                private
        {
                Open storage o = opens[oid];

                require(borrower == o.borrower);
                require(!o.done && o.collateral > 0);

                o.done = true;
                address(uint160(o.borrower)).transfer(o.collateral);
                stake = stake - o.collateral;
                o.collateral = 0;

                emit __cancel(oid, offchain);
        }

        // withdraw remaning money for borrower
        function withdraw(
                address payable borrower,
                uint256 amount,
                bytes32 offchain

        )
                public
                onlyAdmin
        {
                require(amount>0 && address(this).balance - stake >= amount);
                borrower.transfer(amount);
                emit __withdraw(offchain);
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
                bytes32 offchain
        )
                public
        {
                _repay(msg.sender, lid, true, offchain);
        }

        // repay a secured loan. there are 3 ways:
        // 1. borrower defaults (then anyone can repay and get the over-collateral)
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
                require(!l.done && now >= l.end);


                uint256 payment = (l.rate + 10000) * l.principal / 10000;

                l.done = true;
                if (onchain) CONST.transferFrom(repayer, l.lender, payment);

                if (repayer == l.borrower) {
                        repayer.transfer(l.collateral.amount);
                } else {
                        uint amt = payment/oracle.current("ethPrice") * (1+policy.current("ethIncentive"));
                        repayer.transfer(amt);
                        l.borrower.transfer(l.collateral.amount - amt);
                }

                stake = stake - l.collateral.amount;
                emit __repay(lid, l.collateral.amount, l.done, offchain);
        }


        // repay a secured loan.
        // 2. collateral current drops (then liquidation kicks in)
        //
        // note that the repayer must approve the contract to spend its Const first.
        function liquidate(
                uint lid,
                address payable repayer,
                bytes32 offchain

        )
                public
                onlyAdmin
        {

                Loan storage l = loans[lid];
                bool liquidated = oracle.current("ethPrice") * 10000 <= l.collateral.ethPrice * (10000 - policy.current("ethLiquidation"));

                require(!l.done && liquidated);

                l.done = true;

                repayer.transfer(l.collateral.amount);
                stake = stake - l.collateral.amount;

                emit __liquidate(lid, offchain);
        }


        // pay gas for borrower
        function riseupByAdmin(
                uint lid,
                address payable repayer,
                bytes32 offchain
        )
                public
                onlyAdmin
        {

                _riseup(lid, repayer, offchain);
        }

        
        // if a borrower wants to call the contract directly
        function riseup(
                uint lid,
                bytes32 offchain
        )
                public
        {
                _riseup(lid, msg.sender, offchain);
        }


        // repay a secured loan.
        // 3. collateral current rise up to legendary
        //
        // note that the repayer must approve the contract to spend its Const first.
        function _riseup(
                uint lid,
                address payable repayer,
                bytes32 offchain
        )
                private
        {
                Loan storage l = loans[lid];
                bool legendary = (policy.current("ethLegendary") + 10000) * l.collateral.ethPrice <= oracle.current("ethPrice") * 10000;

                require(!l.done && l.borrower == repayer && legendary);


                uint256 amt = l.collateral.amount * oracle.current("ethPrice") / l.collateral.ethPrice;
                uint256 extraAmt = amt - l.collateral.amount;

                repayer.transfer(extraAmt);
                l.collateral.amount = l.collateral.amount - extraAmt;
                l.collateral.ethPrice = oracle.current("ethPrice");

                stake = stake - extraAmt;

                emit __riseup(lid, extraAmt, offchain);
        }


        // admin pay gas for user
        function payoffByAdmin(
                uint lid,
                address payable borrower,
                bool onchain,
                bytes32 offchain
        ) 
                public
                onlyAdmin
        {
                _payoff(lid, borrower, onchain, offchain);
        }


         // if a borrower wants to call the contract directly
        function payoff(
                uint lid,
                bytes32 offchain
        )
                public
        {
                _payoff(lid, msg.sender, true, offchain);
        }


        // borrower repays early
        // 
        // note that the borrower must approve the contract to spend its Const first.
        function _payoff(
                uint lid,
                address payable borrower,
                bool onchain,
                bytes32 offchain
        )
                private
        {
                Loan storage l = loans[lid];
                require(!l.done && now < l.end && l.borrower == borrower);

                l.done = true;

                uint fee = 0;
                if (onchain) {
                        fee = ((now - l.start) / (l.end - l.start)) * 10000;

                        if (fee >= policy.current("ethPayOffThreshold")) {
                                fee = l.rate;
                        } else {
                                fee = fee + (l.rate - fee)/2;
                        }

                        uint256 payment = (l.rate + 10000) * l.principal / 10000;
                        CONST.transferFrom(borrower, l.lender, payment);
                }

                borrower.transfer(l.collateral.amount);

                stake = stake - l.collateral.amount;
                emit __payoff(lid, fee, offchain);
        }


        function loan(uint lid) public view returns (uint, uint, address, uint, bool) {
                Loan storage l = loans[lid];
                return (l.principal, l.end, l.borrower, l.collateral.amount, l.done);
        }


        function open(uint oid) public view returns (uint, uint, uint, uint, bool) {
                Open storage o = opens[oid];
                return (o.amount, o.rate, o.term, o.collateral, o.done);
        }


        function principal(uint collateral) public view returns (uint) {
                uint ethPrice = oracle.current("ethPrice");
                uint p = collateral * (ethPrice * policy.current("ethLTV") / 10000);
                return p;
        }
}
