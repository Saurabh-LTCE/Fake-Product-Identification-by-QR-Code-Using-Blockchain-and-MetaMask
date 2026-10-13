require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris",
    },
  },
  networks: {
    // In-process network used by `npm test`
    hardhat: { chainId: 31337 },
    // The long-running node started with `npm run node`
    localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
  },
};
