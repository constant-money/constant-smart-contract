
var TokenSender = artifacts.require('TokenSender')

module.exports = function(deployer, network, accounts) {
    deployer.deploy(TokenSender)
}
