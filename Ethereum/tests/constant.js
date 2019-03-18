const p2p = artifacts.require("Constant")


const eq = assert.equal
const u = require('./util.js')
const oc = u.oc

contract("Constant", (accounts) => {
        const root = accounts[0]
        const buyer1 = accounts[1]
        const buyer2 = accounts[2]
        const seller1 = accounts[3]
        const seller2 = accounts[4]

        const OFFCHAIN = web3.utils.fromAscii('1')
        before(async () => {
                cs = await p2p.deployed();
        })

        describe('create 2 purchasers', async () => {
            it('the seller1 purchase 100 constants', async () => {
                    const i = {
                            purchaser: seller1,
                            value: 100*100,
                            admin: root
                    }
                    const o = {
                            offchain: OFFCHAIN
                    }

                    _ = await cs.purchase(i.purchaser, i.value, OFFCHAIN, { from: i.admin})
                    let seller1Balance = await cs.balanceOf(i.purchaser, { from: i.admin });
                    eq(i.value, seller1Balance.toNumber())
            })

            it('the seller2 purchase 200 constants', async () => {
                    const i = {
                            purchaser: seller2,
                            value: 200*100,
                            admin: root
                    }
                    const o = {
                    }

                    _ = await cs.purchase(i.purchaser, i.value, OFFCHAIN, { from: i.admin})
                    let seller2Balance = await cs.balanceOf(i.purchaser, { from: i.admin });
                    eq(i.value, seller2Balance.toNumber())
            })
        })

        describe('the seller1 sells 10 constants', async () => {
            it('call sell method', async () => {
                    const i = {
                            seller: seller1,
                            value: 10*100,
                            admin: root
                    }
                    const o = {
                            value: 90*100
                    }

                    _ = await cs.sell(i.seller, i.value, OFFCHAIN, { from: i.admin})
                    let seller1Balance = await cs.balanceOf(i.seller, { from: i.admin });
                    eq(o.value, seller1Balance.toNumber())

                    // get open stake
                    const stake = await cs.getOpenStake(i.seller, { from: i.admin})
                    eq(i.value, stake)
            })
        })

        describe('the buyer1 buy some constants from seller1', async () => {
            it('cannot buy constant from seller1', async () => {
                    const i = {
                            buyer: buyer1,
                            seller: seller1,
                            value: 30*100,
                            admin: root
                    }
                    const o = {
                            
                    }

                    await u.assertRevert(cs.withdraw(i.buyer, i.seller, i.value, OFFCHAIN, { from: i.admin}))
            })

            it('buy constant from seller1', async () => {
                    const i = {
                            buyer: buyer1,
                            seller: seller1,
                            value: 10*100,
                            admin: root
                    }
                    const o = {
                            sellerValue: 0
                    }

                    _ = await cs.withdraw(i.buyer, i.seller, i.value, OFFCHAIN, { from: i.admin})

                    // get open stake
                    const stake = await cs.getOpenStake(i.seller, { from: i.admin})
                    console.log(stake.toNumber())
                    eq(o.sellerValue, stake)

            })
        })
})
