// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RewardToken is ERC20, Ownable {
    mapping(address => bool) public minters;

    event MinterUpdated(address indexed account, bool isMinter);

    constructor(address initialOwner) ERC20("ChainTrace Reward", "CTR") Ownable(initialOwner) {
        _mint(initialOwner, 1_000_000 * 10 ** decimals());
    }

    function setMinter(address account, bool isMinter) external onlyOwner {
        minters[account] = isMinter;
        emit MinterUpdated(account, isMinter);
    }

    function mint(address to, uint256 amount) external {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _mint(to, amount);
    }
}
