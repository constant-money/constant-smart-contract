var SecuredLoan = artifacts.require('SecuredLoan')

module.exports = function(deployer, network, accounts) {
        deployer.deploy(SecuredLoan)
}
