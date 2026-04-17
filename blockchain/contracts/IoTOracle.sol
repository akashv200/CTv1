// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract IoTOracle is Ownable {
    struct SensorRecord {
        string sensorId;
        uint256 productId;
        int256 temperature;
        int256 humidity;
        uint256 timestamp;
        string dataHash;
    }

    mapping(uint256 => SensorRecord[]) private recordsByProduct;
    mapping(address => bool) public oracleNodes;

    event OracleNodeUpdated(address indexed node, bool isActive);
    event SensorDataPublished(uint256 indexed productId, string sensorId, int256 temperature, int256 humidity);

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyOracle() {
        require(oracleNodes[msg.sender] || owner() == msg.sender, "Not oracle node");
        _;
    }

    function setOracleNode(address node, bool isActive) external onlyOwner {
        oracleNodes[node] = isActive;
        emit OracleNodeUpdated(node, isActive);
    }

    function publishSensorData(
        string memory sensorId,
        uint256 productId,
        int256 temperature,
        int256 humidity,
        string memory dataHash
    ) external onlyOracle {
        recordsByProduct[productId].push(
            SensorRecord({
                sensorId: sensorId,
                productId: productId,
                temperature: temperature,
                humidity: humidity,
                timestamp: block.timestamp,
                dataHash: dataHash
            })
        );

        emit SensorDataPublished(productId, sensorId, temperature, humidity);
    }

    function getProductSensorData(uint256 productId) external view returns (SensorRecord[] memory) {
        return recordsByProduct[productId];
    }
}
