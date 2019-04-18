pragma solidity ^0.4.24;

contract SecuredLoan { 

        enum LoanState {Open, Closed, Liquidated}

        struct Asset {
                uint amount;
                uint price;
        }

        struct Loan {
                uint principal;
                uint interest;
                uint term;
                uint since;
                uint end;
                Asset collateral;
                address borrower;
                LoanState state;
        }

        address liquidationAddr;
        mapping(address => bool) admin;
        Loan[] private loans;

        // events to track onchain-offchain relationships
        event __borrow(uint lid, bytes32 offchain);
        event __payoff(bytes32 offchain);
        event __liquidate(bytes32 offchain);

        constructor(address lAddr) public {
                liquidationAddr = lAddr;
                admin[msg.sender] = true;
        }

        modifier onlyAdmin() {
                require(admin[msg.sender]);
                _;
        }

        /**
        * @dev add admin address for load balancing
        * @param addr admin address
        */
        function addAdmin(address addr) public onlyAdmin {
                require(addr != address(0x0));
                admin[addr] = true;
        }

        /**
        * @dev function to extend a secured loan
        * @param principal the amount of constant
        * @param term of loan
        * @param closingWindow time end of loan
        * @param ethInterest interest based on term
        * @param ethPrice current ether price
        */
        function borrow(uint principal, uint term, uint closingWindow, uint ethInterest, uint ethPrice, bytes32 offchain) public payable {
                Loan memory l;
                l.principal = principal;
                l.term = term;
                l.interest = ethInterest;
                l.collateral = Asset(msg.value, ethPrice);
                l.since = now;
                l.end = now + closingWindow * 1 seconds;
                l.borrower = msg.sender;
                l.state = LoanState.Open;

                loans.push(l);
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
                require(now >= l.end);

                l.state = LoanState.Closed;
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
                l.state = LoanState.Liquidated;
                
                liquidationAddr.transfer(l.collateral.amount);
                emit __liquidate(offchain);
        }

}