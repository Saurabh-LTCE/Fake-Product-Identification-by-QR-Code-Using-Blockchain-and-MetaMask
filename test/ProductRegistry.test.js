const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const hashOf = (text) => ethers.keccak256(ethers.toUtf8Bytes(text));

describe("ProductRegistry", function () {
  async function deployFixture() {
    const [owner, other, manufacturer2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ProductRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();
    return { registry, owner, other, manufacturer2 };
  }

  describe("deployment", function () {
    it("makes the deployer the owner and an authorized manufacturer", async function () {
      const { registry, owner, other } = await loadFixture(deployFixture);
      expect(await registry.owner()).to.equal(owner.address);
      expect(await registry.isAuthorizedManufacturer(owner.address)).to.equal(true);
      expect(await registry.isAuthorizedManufacturer(other.address)).to.equal(false);
      expect(await registry.totalProducts()).to.equal(0n);
    });
  });

  describe("registration", function () {
    it("registers a product and emits an event", async function () {
      const { registry, owner } = await loadFixture(deployFixture);
      const hash = hashOf("product-1");
      await expect(registry.registerProduct("P1001", hash))
        .to.emit(registry, "ProductRegistered")
        .withArgs("P1001", hash, owner.address, anyValue);
      expect(await registry.totalProducts()).to.equal(1n);
    });

    it("stores the hash, timestamp and registering account", async function () {
      const { registry, owner } = await loadFixture(deployFixture);
      const hash = hashOf("product-1");
      const tx = await registry.registerProduct("P1001", hash);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const [registered, storedHash, registeredAt, registeredBy] = await registry.getProduct("P1001");
      expect(registered).to.equal(true);
      expect(storedHash).to.equal(hash);
      expect(registeredAt).to.equal(BigInt(block.timestamp));
      expect(registeredBy).to.equal(owner.address);
      expect(await registry.isProductRegistered("P1001")).to.equal(true);
    });

    it("rejects duplicate product IDs", async function () {
      const { registry } = await loadFixture(deployFixture);
      await registry.registerProduct("P1001", hashOf("a"));
      await expect(registry.registerProduct("P1001", hashOf("b"))).to.be.revertedWith(
        "Product ID already registered"
      );
    });

    it("rejects accounts that are not authorized manufacturers", async function () {
      const { registry, other } = await loadFixture(deployFixture);
      await expect(registry.connect(other).registerProduct("P1", hashOf("a"))).to.be.revertedWith(
        "Caller is not an authorized manufacturer"
      );
    });

    it("rejects empty and over-long product IDs", async function () {
      const { registry } = await loadFixture(deployFixture);
      await expect(registry.registerProduct("", hashOf("a"))).to.be.revertedWith(
        "Product ID must be 1-64 characters"
      );
      await expect(registry.registerProduct("x".repeat(65), hashOf("a"))).to.be.revertedWith(
        "Product ID must be 1-64 characters"
      );
    });

    it("rejects an empty (zero) hash", async function () {
      const { registry } = await loadFixture(deployFixture);
      await expect(registry.registerProduct("P1", ethers.ZeroHash)).to.be.revertedWith(
        "Data hash cannot be empty"
      );
    });
  });

  describe("verification", function () {
    it("reports unregistered products", async function () {
      const { registry } = await loadFixture(deployFixture);
      const [registered] = await registry.getProduct("NOPE");
      expect(registered).to.equal(false);
      expect(await registry.isProductRegistered("NOPE")).to.equal(false);
      const [reg, matches] = await registry.verifyProduct("NOPE", hashOf("a"));
      expect(reg).to.equal(false);
      expect(matches).to.equal(false);
    });

    it("detects matching and non-matching hashes", async function () {
      const { registry } = await loadFixture(deployFixture);
      await registry.registerProduct("P1", hashOf("original"));

      const good = await registry.verifyProduct("P1", hashOf("original"));
      expect(good[0]).to.equal(true);
      expect(good[1]).to.equal(true);

      const bad = await registry.verifyProduct("P1", hashOf("tampered"));
      expect(bad[0]).to.equal(true);
      expect(bad[1]).to.equal(false);
    });

    it("can be read by any account", async function () {
      const { registry, other } = await loadFixture(deployFixture);
      await registry.registerProduct("P1", hashOf("a"));
      const [registered] = await registry.connect(other).getProduct("P1");
      expect(registered).to.equal(true);
    });
  });

  describe("manufacturer authorization", function () {
    it("lets the owner authorize and revoke manufacturers", async function () {
      const { registry, manufacturer2 } = await loadFixture(deployFixture);
      await expect(registry.authorizeManufacturer(manufacturer2.address))
        .to.emit(registry, "ManufacturerAuthorized")
        .withArgs(manufacturer2.address);
      await registry.connect(manufacturer2).registerProduct("M2-1", hashOf("a"));

      await expect(registry.revokeManufacturer(manufacturer2.address))
        .to.emit(registry, "ManufacturerRevoked")
        .withArgs(manufacturer2.address);
      await expect(
        registry.connect(manufacturer2).registerProduct("M2-2", hashOf("b"))
      ).to.be.revertedWith("Caller is not an authorized manufacturer");
    });

    it("prevents non-owners from changing authorization", async function () {
      const { registry, other, manufacturer2 } = await loadFixture(deployFixture);
      await expect(registry.connect(other).authorizeManufacturer(manufacturer2.address)).to.be.revertedWith(
        "Only the contract owner can do this"
      );
      await expect(registry.connect(other).revokeManufacturer(manufacturer2.address)).to.be.revertedWith(
        "Only the contract owner can do this"
      );
    });

    it("does not allow revoking the owner or authorizing the zero address", async function () {
      const { registry, owner } = await loadFixture(deployFixture);
      await expect(registry.revokeManufacturer(owner.address)).to.be.revertedWith("The owner cannot be revoked");
      await expect(registry.authorizeManufacturer(ethers.ZeroAddress)).to.be.revertedWith("Invalid address");
    });
  });
});
