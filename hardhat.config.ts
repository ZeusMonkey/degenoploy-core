import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-contract-sizer';
import 'solidity-coverage';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-gas-reporter';
import '@openzeppelin/hardhat-upgrades';

require('dotenv').config();

const mainnetURL = process.env.MAIN_NET_API_URL;
const goerliURL = process.env.GOERLI_NET_API_URL;

const mnemonic = process.env.MNEMONIC;

const apiKey = process.env.ETHERSCAN_API_KEY;

const addressOffset = 0;
const numAddressesGenerated = 5;
const mnemonicPathMainNet = "m/44'/60'/0'/0/";
const mnemonicPathTestNet = "m/44'/1'/0'/0/";

export default {
  solidity: {
    compilers: [
      {
        version: '0.8.20',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
        docker: true,
      },
    ],
  },
  // contractSizer: {
  //   alphaSort: true,
  //   runOnCompile: true,
  //   disambiguatePaths: false,
  // },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  typechain: {
    outDir: 'types/',
    target: 'ethers-v5',
  },
  networks: {
    hardhat: {
      forking: {
        url: mainnetURL,
      },
      hardfork: 'london',
      gasPrice: 'auto',
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      gas: 6012388,
    },
    mainnet: {
      url: mainnetURL,
      accounts: {
        mnemonic,
        path: mnemonicPathMainNet,
        initialIndex: addressOffset,
        count: numAddressesGenerated,
      },
    },
    goerli: {
      url: goerliURL,
      accounts: {
        mnemonic,
        path: mnemonicPathTestNet,
        initialIndex: addressOffset,
        count: numAddressesGenerated,
      },
    },
  },
  paths: {
    deploy: 'deploy',
    deployments: 'deployments',
    imports: 'imports',
  },
  etherscan: {
    apiKey,
  },
};
