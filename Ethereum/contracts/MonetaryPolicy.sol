pragma solidity ^0.5;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import './Admin.sol';

contract MonetaryPolicy is ERC20, Admin { 

        // token info
        string public constant name = "Monetary Policy Token"; 
        string public constant symbol = "MPT"; 
        uint public constant decimals = 0;
        uint private supply;

        struct Proposal {
                bytes32 key;
                uint value;
                uint yes;
                uint no;
                uint deadline;

                // 0: empty, 1: proposed, 2: approved
                uint status;
        }

        // monetary policy parameters such as ratio, threshold, interest
        mapping(bytes32 => uint) private params;        

        // proposal
        Proposal[] private proposals;

        // events for syncing onchain and offchain execution
        event __transferByAdmin(bytes32 offchain);
        event __mint(bytes32 offchain);
        event __propose(uint pid, bytes32 offchain);
        event __vote(bytes32 offchain);
        event __setParam(bytes32 offchain);


        /**
         * @dev constructor that populates a bunch of default params
         */
        constructor() public {

                // saving interest
                params["interest"] = 360; // 3.60%

                // secured loan
                params["ethRatio"] = 50; // 50%
                params["ethInterest"] = 300; // 3.00%
                params["ethThreshold"] = 80; // 3.00%

                // voting
                params["votingWindow"] = 7 * 1 days;
                params["quorum"] = 20; // 20%
                params["majorityMargin"] = 51; // 51%
        }

        /**
         * @dev function to transfer MPT
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
         * @dev function to mint new MPT
         * @param to the address that will receive the newly minted MPT
         * @param value the amount of MPT to mint
         */
        function mint(
                address to, 
                uint value, 
                bytes32 offchain
        ) 
                public 
                onlyAdmin 
        {
                _mint(to, value);
                supply += value;
                emit __mint(offchain); 
        }


        /**
         * @dev getter function to get a param value
         */
        function param(bytes32 key) public view returns (uint){
                return params[key];
        }


        /**
         * @dev function to submit a new proposal
         */
        function propose(bytes32 key, uint value, bytes32 offchain) public {
                Proposal memory p;
                p.key = key;
                p.value = value;
                p.deadline = now + params["votingWindow"];
                p.status = 1;

                proposals.push(p);

                emit __propose(proposals.length - 1, offchain);
        }


        /**
         * @dev function to vote on a proposal
         */
        function vote(uint pid, bool yes, bytes32 offchain) public {
                Proposal storage p = proposals[pid];
                require(p.status == 1);
                require(now < p.deadline);

                if (yes) 
                        p.yes += balanceOf(msg.sender);
                else 
                        p.no += balanceOf(msg.sender);

                if ((p.yes + p.no) * 100 > params["quorum"] * supply) {
                        if (p.yes * 100 > params["majorityMargin"] * (p.yes + p.no)) {
                                p.status = 2;
                                params[p.key] = p.value;

                                emit __setParam(offchain);
                        }
                }

                emit __vote(offchain);
        }
}
