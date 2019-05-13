pragma solidity ^0.5;

import './Admin.sol';

contract Oracle is Admin { 

        // data feed size 
        uint private size;

        // how often an oracle is allowed to submit a new data
        uint private frequency;

        // data feed
        mapping(bytes32 => uint[]) private currents; 

        // timestamps to avoid an oracle to flood the feed
        mapping(bytes32 => mapping(address => uint)) private timestamps;

        // oracles
        mapping(address => bool) private oracles;

        // events syncing onchain and offchain
        event __addOracle(bytes32 offchain);
        event __removeOracle(bytes32 offchain);
        event __setSize(bytes32 offchain);
        event __setFrequency(bytes32 offchain);
        event __feed(bytes32 offchain);

        modifier onlyOracle() {
                require(oracles[msg.sender]);
                _;
        }


        /**
         * @dev constructor that populates a bunch of default params
         */
        constructor() public {
                size = 10;
                frequency = 1 seconds;
        }

        /**
         * @dev function to add an oracles 
         */
        function addOracle(address a, bytes32 offchain) public onlyAdmin {
                oracles[a] = true;
                emit __addOracle(offchain);
        }


        /**
         * @dev function to remove an oracles 
         */
        function removeOracle(address a, bytes32 offchain) public onlyAdmin {
                oracles[a] = false;
                emit __removeOracle(offchain);
        }


        /**
         * @dev function to set data feed size
         */
        function setSize(uint _size, bytes32 offchain) public onlyAdmin {
                size = _size;
                emit __setSize(offchain);
        }


        /**
         * @dev function to set oracle update frequency
         */
        function setFrequency(uint _frequency, bytes32 offchain) public onlyAdmin {
                frequency = _frequency;
                emit __setFrequency(offchain);
        }

        /**
         * @dev function to feed a new piece of data
         */
        function feed(bytes32 key, uint current, bytes32 offchain) public onlyOracle {

                // avoid flood attack
                require(now > timestamps[key][msg.sender] + frequency);
                timestamps[key][msg.sender] = now;

                // insert data to the currents
                bool inserted = false;

                for (uint i = 0; i < currents[key].length; i++) {
                        if (current < currents[key][i]) {
                                for (uint j = i+1; j < currents[key].length; j++) {
                                        currents[key][j] = currents[key][j-1];
                                }
                                currents[key][i] = current;
                                inserted = true;
                                break;
                        }
                }

                if (!inserted) { 
                        if (currents[key].length == size) {
                                for (uint k = 0; k < currents[key].length-1; k++) {
                                        currents[key][k] = currents[key][k+1];
                                }
                                currents[key][currents[key].length-1] = current;
                        } else 
                                currents[key].push(current);
                }

                emit __feed(offchain);
        }

        
        /**
         * @dev getter function to get a data current, median of the data feed
         */
        function current(bytes32 key) public view returns (uint){
                return currents[key][currents[key].length/2];
        }

        function data() public onlyAdmin view returns (uint, uint) {
                return (size, frequency);
        }
}
