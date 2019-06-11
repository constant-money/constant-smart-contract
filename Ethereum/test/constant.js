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

        it('remove admin', async() => {
            const i = {
                empty: '0x0000000000000000000000000000000000000000',
                admin: admin,
                superAdmin: root,
            }

            await u.assertRevert(c.removeAdmin(i.empty, {from: i.superAdmin}))
            await u.assertRevert(c.removeAdmin(i.admin, {from: i.admin}))
            await c.removeAdmin(i.admin, {from: i.superAdmin})

        });

        })


})
