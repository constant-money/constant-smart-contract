pragma solidity ^0.5;

import './Admin.sol';

contract SimplePolicy is Admin { 

        mapping(bytes32 => uint) private currents;        

        event __setParam(bytes32 offchain);

        constructor() public {
                currents["ethLTV"] = 6666; // 66.66%
                currents["ethLiquidation"] = 1500; // 10.00%
                currents["ethIncentive"] = 300; // 3.00%
                currents["ethLegendary"] = 1500; // 15.00%
                currents["ethPayOffThreshold"] = 7500; // 75.00%
        }

        function setParam(bytes32 key, uint value, bytes32 offchain) public onlyAdmin {
                currents[key] = value;
                emit __setParam(offchain);
        }

        function current(bytes32 key) public view returns (uint){
                return currents[key];
        }
}
