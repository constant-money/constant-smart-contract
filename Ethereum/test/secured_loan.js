const p2p = artifacts.require("SecuredLoan")


const eq = assert.equal
const u = require('./util.js')
const oc = u.oc

contract("SecuredLoan", (accounts) => {
        const root = accounts[0]
        const borrow1 = accounts[1]
        const borrow2 = accounts[2]


        const OFFCHAIN = web3.utils.fromAscii('1')
        before(async () => {
                cs = await p2p.deployed();
        })

})
