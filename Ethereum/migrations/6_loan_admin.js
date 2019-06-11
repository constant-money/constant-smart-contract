var LoanAdmin = artifacts.require('LoanAdmin')

module.exports = function(deployer, network, accounts) {
        deployer.deploy(LoanAdmin)
}
