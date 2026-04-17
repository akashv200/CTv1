// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AccessControl.sol";

contract UniversalTraceability is AccessControlManager {
    uint256 private productCounter;

    struct Product {
        uint256 id;
        string productName;
        string domain;
        address registeredBy;
        uint256 timestamp;
        string ipfsHash;
        bool isActive;
        bool recalled;
    }

    struct Checkpoint {
        uint256 productId;
        address addedBy;
        string checkpointType;
        string location;
        uint256 timestamp;
        string dataHash;
        bool verified;
    }

    struct Certificate {
        uint256 productId;
        string certificateType;
        string issuer;
        uint256 issueDate;
        uint256 expiryDate;
        string ipfsHash;
    }

    struct Relationship {
        string networkId;
        string buyerId;
        string supplierId;
        string role;
        uint256 timestamp;
        address registeredBy;
    }

    mapping(uint256 => Product) public products;
    mapping(uint256 => Checkpoint[]) private checkpointsByProduct;
    mapping(uint256 => Certificate[]) private certificatesByProduct;
    mapping(string => Relationship[]) private networkRelationships;
    mapping(uint256 => string) public recallReason;

    event ProductRegistered(uint256 indexed productId, string domain, address registeredBy);
    event CheckpointAdded(uint256 indexed productId, string checkpointType, uint256 timestamp);
    event CertificateAdded(uint256 indexed productId, string certificateType);
    event RelationshipRegistered(string indexed networkId, string buyerId, string supplierId, string role);
    event ProductRecalled(uint256 indexed productId, string reason);

    constructor() AccessControlManager(msg.sender) {}

    function registerProduct(
        string memory productName,
        string memory domain,
        string memory ipfsHash
    ) external onlyAuthorized returns (uint256) {
        productCounter += 1;
        products[productCounter] = Product({
            id: productCounter,
            productName: productName,
            domain: domain,
            registeredBy: msg.sender,
            timestamp: block.timestamp,
            ipfsHash: ipfsHash,
            isActive: true,
            recalled: false
        });

        emit ProductRegistered(productCounter, domain, msg.sender);
        return productCounter;
    }

    function addCheckpoint(
        uint256 productId,
        string memory checkpointType,
        string memory location,
        string memory dataHash
    ) external onlyAuthorized {
        Product memory product = products[productId];
        require(product.id != 0, "Product not found");
        require(product.isActive, "Product inactive");

        checkpointsByProduct[productId].push(
            Checkpoint({
                productId: productId,
                addedBy: msg.sender,
                checkpointType: checkpointType,
                location: location,
                timestamp: block.timestamp,
                dataHash: dataHash,
                verified: true
            })
        );

        emit CheckpointAdded(productId, checkpointType, block.timestamp);
    }

    function addCertificate(
        uint256 productId,
        string memory certificateType,
        string memory issuer,
        uint256 expiryDate,
        string memory ipfsHash
    ) external onlyAuthorized {
        Product memory product = products[productId];
        require(product.id != 0, "Product not found");

        certificatesByProduct[productId].push(
            Certificate({
                productId: productId,
                certificateType: certificateType,
                issuer: issuer,
                issueDate: block.timestamp,
                expiryDate: expiryDate,
                ipfsHash: ipfsHash
            })
        );

        emit CertificateAdded(productId, certificateType);
    }

    function getProductJourney(uint256 productId) external view returns (Checkpoint[] memory) {
        return checkpointsByProduct[productId];
    }

    function getProductCertificates(uint256 productId) external view returns (Certificate[] memory) {
        return certificatesByProduct[productId];
    }

    function verifyProduct(uint256 productId) external view returns (bool, Product memory) {
        Product memory product = products[productId];
        bool isValid = product.id != 0 && product.isActive && !product.recalled;
        return (isValid, product);
    }

    function initiateRecall(uint256 productId, string memory reason) external onlyOwner {
        Product storage product = products[productId];
        require(product.id != 0, "Product not found");
        product.recalled = true;
        product.isActive = false;
        recallReason[productId] = reason;
        emit ProductRecalled(productId, reason);
    }

    function registerRelationship(
        string memory networkId,
        string memory buyerId,
        string memory supplierId,
        string memory role
    ) external onlyAuthorized {
        networkRelationships[networkId].push(
            Relationship({
                networkId: networkId,
                buyerId: buyerId,
                supplierId: supplierId,
                role: role,
                timestamp: block.timestamp,
                registeredBy: msg.sender
            })
        );

        emit RelationshipRegistered(networkId, buyerId, supplierId, role);
    }

    function getNetworkRelationships(string memory networkId) external view returns (Relationship[] memory) {
        return networkRelationships[networkId];
    }
}
