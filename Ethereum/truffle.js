const HDWalletProvider = require("truffle-hdwallet-provider");
//const dotenv = require('dotenv')
//const result = dotenv.config()
require('dotenv').config();

/*if (result.error) {
  throw result.error
}*/

/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() {
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>')
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*"
    },
    /*tomotestnet: {
      provider: () => new HDWalletProvider(
        result.parsed.ETHEREUM_PRIVATE_KEY,
        "https://testnet.tomochain.com",
        0,
        1,
        true,
        "m/44'/889'/0'/0/",
      ),
      network_id: "89",
      gas: 2000000,
      gasPrice: 10000000000000,
    },
    tomomainnet: {
      provider: () => new HDWalletProvider(
        result.parsed.ETHEREUM_PRIVATE_KEY,
        "https://rpc.tomochain.com",
        0,
        1,
        true,
        "m/44'/889'/0'/0/",
      ),
      network_id: "88",
      gas: 2000000,
      gasPrice: 10000000000000,
    }*/
  },
  compilers: {
    solc: {
      version: "0.5.2"
    }
  },
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions : {
      currency: 'USD',
      gasPrice: 21
    }
  }
};
