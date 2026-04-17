// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AccessControlManager is Ownable {
    mapping(address => bool) public authorizedUsers;

    event UserAuthorized(address indexed user, bool isAuthorized);

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyAuthorized() {
        require(authorizedUsers[msg.sender] || owner() == msg.sender, "Not authorized");
        _;
    }

    function setAuthorizedUser(address user, bool isAuthorized) external onlyOwner {
        authorizedUsers[user] = isAuthorized;
        emit UserAuthorized(user, isAuthorized);
    }
}
