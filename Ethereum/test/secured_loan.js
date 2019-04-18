const p2p = artifacts.require("SecuredLoan")


const eq = assert.equal
const u = require('./util.js')
const oc = u.oc

contract("SecuredLoan", (accounts) => {
        const root = accounts[0]
        const liquidator = accounts[1]
        const borrower1 = accounts[2]
        const borrower2 = accounts[3]

        const OFFCHAIN = web3.utils.fromAscii('1')
        before(async () => {
                cs = await p2p.deployed(liquidator.address);
        })


})
