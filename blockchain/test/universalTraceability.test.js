const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UniversalTraceability (Phase 2: Agriculture)", function () {
  async function deployFixture() {
    const [owner, farmer, logistics, auditor] = await ethers.getSigners();
    const UniversalTraceability = await ethers.getContractFactory("UniversalTraceability");
    const contract = await UniversalTraceability.deploy();
    await contract.waitForDeployment();
    
    // Authorize roles for testing
    await contract.connect(owner).setAuthorizedUser(farmer.address, true);
    await contract.connect(owner).setAuthorizedUser(logistics.address, true);
    await contract.connect(owner).setAuthorizedUser(auditor.address, true);
    
    return { contract, owner, farmer, logistics, auditor };
  }

  describe("Phase 2 Core Loop: Register Product", function () {
    it("farmer registers organic rice product", async function () {
      const { contract, farmer } = await deployFixture();
      
      // Phase 2: Farmer registers product
      await contract.connect(farmer).registerProduct(
        "AG-123456-ABCD", // Product ID from SPEC
        "agriculture", 
        "ipfs://metadata"
      );
      
      // Verify product was registered
      const [isValid, product] = await contract.verifyProduct(1);
      expect(isValid).to.equal(true);
      expect(product.productName).to.equal("AG-123456-ABCD");
      expect(product.domain).to.equal("agriculture");
    });

    it("tracks product through supply chain", async function () {
      const { contract, farmer, logistics } = await deployFixture();
      
      // Step 1: Farmer registers product
      await contract.connect(farmer).registerProduct(
        "AG-789012-WXYZ",
        "agriculture",
        "ipfs://harvest-data"
      );
      
      // Step 2: Logistics adds checkpoint (harvested)
      await contract.connect(logistics).addCheckpoint(
        1,
        "harvested",
        "Farm location",
        "ipfs://checkpoint-1"
      );
      
      // Step 3: Logistics adds checkpoint (shipped)
      await contract.connect(logistics).addCheckpoint(
        1,
        "shipped",
        "Distribution center",
        "ipfs://checkpoint-2"
      );
      
      // Step 4: Get full journey
      const journey = await contract.getProductJourney(1);
      expect(journey.length).to.equal(2);
      expect(journey[0].checkpointType).to.equal("harvested");
      expect(journey[1].checkpointType).to.equal("shipped");
      
      // Verify product still valid
      const [isValid] = await contract.verifyProduct(1);
      expect(isValid).to.equal(true);
    });
  });

  describe("Phase 2 Core Loop: Public Verification", function () {
    it("consumer verifies product via QR code scan", async function () {
      const { contract, farmer, logistics } = await deployFixture();
      
      // Farmer registers
      await contract.connect(farmer).registerProduct(
        "AG-QR-CODE-01",
        "agriculture",
        "ipfs://qr-product"
      );
      
      // Logistics adds checkpoints
      await contract.connect(logistics).addCheckpoint(
        1,
        "harvested",
        "Origin farm",
        "ipfs://qr-cp1"
      );
      
      await contract.connect(logistics).addCheckpoint(
        1,
        "delivered",
        "Retail store",
        "ipfs://qr-cp2"
      );
      
      // Consumer (public) verifies
      const [isValid, product] = await contract.verifyProduct(1);
      expect(isValid).to.equal(true);
      expect(product.domain).to.equal("agriculture");
      
      const journey = await contract.getProductJourney(1);
      expect(journey.length).to.equal(2);
    });
  });

  describe("Atomicity and Rollback", function () {
    it("rejects checkpoint for non-existent product", async function () {
      const { contract, logistics } = await deployFixture();
      
      // Try to add checkpoint to non-existent product
      await expect(
        contract.connect(logistics).addCheckpoint(
          999,
          "shipped",
          "Location",
          "ipfs://bad"
        )
      ).to.be.reverted;
    });

    it("prevents unauthorized users from registering products", async function () {
      const [, , , , unauthorized] = await ethers.getSigners();
      const { contract } = await deployFixture();
      
      // Unauthorized user tries to register
      await expect(
        contract.connect(unauthorized).registerProduct(
          "AG-HACK-01",
          "agriculture",
          "ipfs://hack"
        )
      ).to.be.reverted;
    });
  });

  describe("Gas Reporting", function () {
    it("measures gas for registerProduct (agriculture domain)", async function () {
      const { contract, farmer } = await deployFixture();
      
      const tx = await contract.connect(farmer).registerProduct(
        "AG-GAS-01",
        "agriculture",
        "ipfs://gas-test"
      );
      
      const receipt = await tx.wait();
      console.log(`[Phase 2] registerProduct gas used: ${receipt.gasUsed.toString()}`);
      
      // Verify it executed
      const [isValid] = await contract.verifyProduct(1);
      expect(isValid).to.equal(true);
    });

    it("measures gas for addCheckpoint (agriculture domain)", async function () {
      const { contract, farmer, logistics } = await deployFixture();
      
      await contract.connect(farmer).registerProduct(
        "AG-GAS-02",
        "agriculture",
        "ipfs://gas-product"
      );
      
      const tx = await contract.connect(logistics).addCheckpoint(
        1,
        "shipped",
        "Farm -> Market",
        "ipfs://gas-checkpoint"
      );
      
      const receipt = await tx.wait();
      console.log(`[Phase 2] addCheckpoint gas used: ${receipt.gasUsed.toString()}`);
      
      // Verify it executed
      const journey = await contract.getProductJourney(1);
      expect(journey.length).to.equal(1);
    });
  });
});
