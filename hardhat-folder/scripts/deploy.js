const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const gameofcards = await hre.ethers.getContractFactory("gameofcards");
  const gameofcards = await gameofcards.deploy();

  await gameofcards.deployed();

  console.log(`gameofcards contract deployed to ${gameofcards.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
