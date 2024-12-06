require("@nomicfoundation/hardhat-ethers");

module.exports = {
  solidity: "0.8.27",
  paths: {
    artifacts: './src/artifacts',
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
  }
};