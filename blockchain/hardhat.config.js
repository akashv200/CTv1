require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const GANACHE_RPC_URL = process.env.GANACHE_RPC_URL ?? "http://127.0.0.1:7545";
const GANACHE_CHAIN_ID = Number(process.env.GANACHE_CHAIN_ID ?? "5777");
const GANACHE_PRIVATE_KEY = process.env.GANACHE_PRIVATE_KEY ?? "";
const GANACHE_MNEMONIC = process.env.GANACHE_MNEMONIC ?? "";
const normalizedPrivateKey = GANACHE_PRIVATE_KEY
  ? GANACHE_PRIVATE_KEY.startsWith("0x")
    ? GANACHE_PRIVATE_KEY
    : `0x${GANACHE_PRIVATE_KEY}`
  : "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    hardhat: {},
    ganache: {
      url: GANACHE_RPC_URL,
      chainId: GANACHE_CHAIN_ID,
      accounts: normalizedPrivateKey ? [normalizedPrivateKey] : GANACHE_MNEMONIC ? { mnemonic: GANACHE_MNEMONIC } : undefined
    }
  }
};
