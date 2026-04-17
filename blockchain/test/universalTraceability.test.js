const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UniversalTraceability", function () {
  async function deployFixture() {
    const [owner, producer] = await ethers.getSigners();
    const UniversalTraceability = await ethers.getContractFactory("UniversalTraceability");
    const contract = await UniversalTraceability.deploy();
    await contract.waitForDeployment();
    await contract.connect(owner).setAuthorizedUser(producer.address, true);
    return { contract, owner, producer };
  }

  it("registers a product and appends checkpoints", async function () {
    const { contract, producer } = await deployFixture();
    await contract.connect(producer).registerProduct("Organic Rice", "agriculture", "ipfs://meta");
    const [isValid, product] = await contract.verifyProduct(1);

    expect(isValid).to.equal(true);
    expect(product.productName).to.equal("Organic Rice");

    await contract.connect(producer).addCheckpoint(1, "received", "Farm", "ipfs://cp1");
    const journey = await contract.getProductJourney(1);
    expect(journey.length).to.equal(1);
    expect(journey[0].checkpointType).to.equal("received");
  });

  it("recalls a product", async function () {
    const { contract, owner, producer } = await deployFixture();
    await contract.connect(producer).registerProduct("Amoxicillin", "pharmaceutical", "ipfs://meta2");
    await contract.connect(owner).initiateRecall(1, "Contamination risk");

    const [isValid, product] = await contract.verifyProduct(1);
    expect(isValid).to.equal(false);
    expect(product.recalled).to.equal(true);
  });
});
