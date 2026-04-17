const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const AccessControl = await hre.ethers.getContractFactory("AccessControlManager");
  const accessControl = await AccessControl.deploy(deployer.address);
  await accessControl.waitForDeployment();

  const UniversalTraceability = await hre.ethers.getContractFactory("UniversalTraceability");
  const universalTraceability = await UniversalTraceability.deploy();
  await universalTraceability.waitForDeployment();

  const IoTOracle = await hre.ethers.getContractFactory("IoTOracle");
  const iotOracle = await IoTOracle.deploy(deployer.address);
  await iotOracle.waitForDeployment();

  const RewardToken = await hre.ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy(deployer.address);
  await rewardToken.waitForDeployment();

  console.log("AccessControl:", await accessControl.getAddress());
  console.log("UniversalTraceability:", await universalTraceability.getAddress());
  console.log("IoTOracle:", await iotOracle.getAddress());
  console.log("RewardToken:", await rewardToken.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
