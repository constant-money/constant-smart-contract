var SimplePolicy = artifacts.require('SimplePolicy')

module.exports = function(deployer, network, accounts) {
        deployer.deploy(SimplePolicy)
}
