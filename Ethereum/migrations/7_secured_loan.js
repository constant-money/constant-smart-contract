
var SecuredLoan = artifacts.require('SecuredLoan')
var SimplePolicy = artifacts.require('SimplePolicy')
var Oracle = artifacts.require('Oracle')
var Constant = artifacts.require('Constant')
var LoanAdmin = artifacts.require('LoanAdmin')

module.exports = function(deployer, network, accounts) {
        deployer.deploy(SecuredLoan, SimplePolicy.address, Oracle.address, Constant.address, LoanAdmin.address)
}
