var Constant = artifacts.require('Constant')

module.exports = function(deployer, network, accounts) {
        deployer.deploy(Constant)
}
