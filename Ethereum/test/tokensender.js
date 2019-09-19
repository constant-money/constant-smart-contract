const sender = artifacts.require("TokenSender")
const constant = artifacts.require("Constant")

const eq = assert.equal
const u = require('./util.js')
const oc = u.oc
let sl, sp, or, c;


contract("Constant", (accounts) => {
    const root = accounts[0]
    const account1 = accounts[1]
    const account2 = accounts[2]
    const admin = accounts[3]
    const OFFCHAIN = web3.utils.fromAscii('1')

    before(async() =>
        {
            c = await
            sender.deployed()

            cts = await
            constant.deployed()
        }
        )
    describe('admin func', () => {

        it('add admin', async() => {
        const i = {
            empty: '0x0000000000000000000000000000000000000000',
            admin: admin,
            superAdmin: root,
        }

            await c.addAdmin(i.admin, {from: i.superAdmin})
            await u.assertRevert(c.addAdmin(i.empty, {from: i.superAdmin}))
            await u.assertRevert(c.addAdmin(i.admin, {from: i.admin}))

        });

        it('send token', async() => {
            const i = {
                tokenAddress: cts.address,
                recipient: account2,
                amount: 1000,
                amount1: 100,

                offchain:  web3.utils.fromAscii('1')
            }

            let tx1 = await cts.purchase(c.address,i.amount,i.offchain, {from: root})
            //let tx2 = await cts.approve(c.address, 30000000,{from: admin})
            //let tx3 = await cts.approve(i.tokenAddress, 30000000,{from: admin})

            let tx = await c.erc20TokenSend(i.tokenAddress,i.recipient,i.amount1,i.offchain, {from: admin})
            blContract = await cts.balanceOf(c.address);
            blReceipient = await cts.balanceOf(i.recipient);
            console.log(blContract.toString())
            console.log(blReceipient.toString())


        });

        })


})
