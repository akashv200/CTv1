const { HDNodeWallet } = require("ethers");
const mnemonic = "atom license nature soon version rib safe dragon tilt frequent include law";
const wallet = HDNodeWallet.fromPhrase(mnemonic);
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);
