const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("gameofcards contract", function () {
  async function deployContractFixture() {
    const gameofcards = await ethers.getContractFactory("gameofcards");

    const [owner, addr1, addr2] = await ethers.getSigners();

    const gameofcards = await gameofcards.deploy();

    await gameofcards.deployed();

    return {
      gameofcards,
      owner,
      addr1,
      addr2,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { gameofcards, owner } = await loadFixture(deployContractFixture);

      expect(await gameofcards.owner()).to.equal(owner.address);
    });
  });

  describe("Changing parameters", function () {
    it("Should change casino address to given address", async function () {
      const { gameofcards, owner, addr1 } = await loadFixture(
        deployContractFixture
      );

      const changeAddress = await gameofcards
        .connect(owner)
        .changeAddress(addr1.address);

      expect(await gameofcards.casinoAddress()).to.equal(addr1.address);
    });
    it("Should change bet amount to given amount", async function () {
      const { gameofcards, owner, addr1 } = await loadFixture(
        deployContractFixture
      );

      const changeBetAmount = await gameofcards
        .connect(owner)
        .changeBetAmount(ethers.utils.parseEther("1.0"));

      expect(await gameofcards.betAmount()).to.equal(
        ethers.utils.parseEther("1.0")
      );
    });
  });

  describe("Functions", function () {
    it("Should not start game with less amount of ether than required", async function () {
      const { gameofcards, owner, addr1 } = await loadFixture(
        deployContractFixture
      );

      await expect(
        gameofcards
          .connect(addr1)
          .startGame({ value: ethers.utils.parseEther("0.001") })
      ).to.be.revertedWith("Not enough ETH sent");
    });
    it("Should start game with right amount of ether transfer", async function () {
      const { gameofcards, owner, addr1 } = await loadFixture(
        deployContractFixture
      );

      const startGame = await gameofcards
        .connect(addr1)
        .startGame({ value: ethers.utils.parseEther("0.01") });

      const playerMapping = await gameofcards.players(addr1.address);
      await expect(playerMapping.playerAddress).to.equal(addr1.address);
    });
    it("Should not let player withdraw bet before game ended", async function () {
      const { gameofcards, owner, addr1 } = await loadFixture(
        deployContractFixture
      );

      const startGame = await gameofcards
        .connect(addr1)
        .startGame({ value: ethers.utils.parseEther("0.01") });
      await expect(
        gameofcards.connect(addr1).withdrawBet(ethers.utils.parseEther("0.01"))
      ).to.be.revertedWith("Game is ongoing");
    });
    it("Should not let a non-player address withdraw ETH from contract", async function () {
      const { gameofcards, owner, addr1 } = await loadFixture(
        deployContractFixture
      );

      await expect(
        gameofcards.connect(addr1).withdrawBet(ethers.utils.parseEther("0.01"))
      ).to.be.revertedWith("No active game has been found");
    });
    it("Should not let player withdraw more ETH than their current bet", async function () {
      const { gameofcards, owner, addr1 } = await loadFixture(
        deployContractFixture
      );

      const startGame = await gameofcards
        .connect(addr1)
        .startGame({ value: ethers.utils.parseEther("0.01") });
      const endGame = await gameofcards
        .connect(owner)
        .endGame(addr1.address, ethers.utils.parseEther("0.01"));

      await expect(
        gameofcards.connect(addr1).withdrawBet(ethers.utils.parseEther("0.02"))
      ).to.be.revertedWith("You dont have enough credit in your account");
    });
    it("Should let player withdraw their bet from contract", async function () {
      const { gameofcards, owner, addr1 } = await loadFixture(
        deployContractFixture
      );

      const changeBetAmount = await gameofcards
        .connect(owner)
        .changeBetAmount(ethers.utils.parseEther("1.0"));

      const startGame = await gameofcards
        .connect(addr1)
        .startGame({ value: ethers.utils.parseEther("1.0") });

      const balanceBefore = await addr1.getBalance();
      const accountBalanceBefore = ethers.utils.formatEther(balanceBefore);
      const remainderBefore = Math.round(accountBalanceBefore * 1e4) / 1e4;

      const endGame = await gameofcards
        .connect(owner)
        .endGame(addr1.address, ethers.utils.parseEther("1.0"));
      const withdrawBet = await gameofcards
        .connect(addr1)
        .withdrawBet(ethers.utils.parseEther("1.0"));

      const balanceAfter = await addr1.getBalance();
      const accountBalanceAfter = ethers.utils.formatEther(balanceAfter);
      const remainderAfter = Math.round(accountBalanceAfter * 1e4) / 1e4;

      expect(remainderAfter).to.be.gte(remainderBefore + 0.9998);
    });
  });
});
