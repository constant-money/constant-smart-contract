const policy = artifacts.require("SimplePolicy")
const oracle = artifacts.require("Oracle")
const p2p = artifacts.require("SecuredLoan")


const eq = assert.equal
const u = require('./util.js')
const oc = u.oc
let sl, sp, or;

contract("SecuredLoan", (accounts) => {
        const root = accounts[0]
        const liquidator = accounts[1]
        const borrower1 = accounts[2]
        const borrower2 = accounts[3]
        const admin1 = accounts[4]

        const OFFCHAIN = web3.utils.fromAscii('1')

        before(async () => {
                // sl = await p2p.deployed()
        })

        // describe('init contract', () => {

        //         it('check admin', async() => {
        //                 let value = await sl.admin(root)
        //                 eq(true, value)

        //                 value = await sl.admin(liquidator)
        //                 eq(false, value)
        //         });

        // })


        // describe('add admin', () => {

        //         it('failed if address is empty', async() => {
        //                 const i = {
        //                         address: '0x0000000000000000000000000000000000000000',
        //                         admin: root
        //                 }

        //                 await u.assertRevert(sl.addAdmin(i.address, {from: i.admin}))
        //         });


        //         it('borrower call it', async() => {
        //                 const i = {
        //                         address: admin1,
        //                         admin: borrower1
        //                 }
        //                 await u.assertRevert(sl.addAdmin(i.address, {from: i.admin}))
        //         });

        //         it('only admin can call it', async() => {
        //                 const i = {
        //                         address: admin1,
        //                         admin: root
        //                 }
        //                 await sl.addAdmin(i.address, {from: i.admin})
        //         });

        // })


        // describe('remove admin', () => {

        //         it('failed if address is empty', async() => {
        //                 const i = {
        //                         address: '0x0000000000000000000000000000000000000000',
        //                         admin: root
        //                 }

        //                 await u.assertRevert(sl.removeAdmin(i.address, {from: i.admin}))
        //         });


        //         it('borrower call it', async() => {
        //                 const i = {
        //                         address: admin1,
        //                         admin: borrower1
        //                 }
        //                 await u.assertRevert(sl.removeAdmin(i.address, {from: i.admin}))
        //         });

        //         it('only admin can call it', async() => {
        //                 const i = {
        //                         address: admin1,
        //                         admin: root
        //                 }
        //                 await sl.removeAdmin(i.address, {from: i.admin})
        //         });

        // })

        // describe('borrow', () => {

        //         it('borrower 1 create loan', async() => {
        //                 const i = {
        //                         principal: 1000,
        //                         term: 1,
        //                         closingWindow: 200,
        //                         ethInterest: 360,
        //                         ethPrice: 17630,
        //                         borrower: borrower1
        //                 }

        //                 const o = {
        //                         lid: 0
        //                 }
        //                 const tx = await sl.borrow(i.principal, i.term, i.closingWindow, i.ethInterest, i.ethPrice, OFFCHAIN, {from: i.borrower})
        //                 eq(o.lid, await oc(tx, "__borrow", "lid"))
        //         })


        //         it('borrower 2 create loan', async() => {
        //                 const i = {
        //                         principal: 1000,
        //                         term: 1,
        //                         closingWindow: 200,
        //                         ethInterest: 360,
        //                         ethPrice: 17630,
        //                         borrower: borrower1
        //                 }

        //                 const o = {
        //                         lid: 1
        //                 }
        //                 const tx = await sl.borrow(i.principal, i.term, i.closingWindow, i.ethInterest, i.ethPrice, OFFCHAIN, {from: i.borrower})
        //                 eq(o.lid, await oc(tx, "__borrow", "lid"))
        //         })


        // })        

        // describe('payoff', () => {

        //         before(async () => {
        //                 const i = {
        //                         principal: 1000,
        //                         term: 1,
        //                         closingWindow: 200,
        //                         ethInterest: 360,
        //                         ethPrice: 17630,
        //                         borrower: borrower1,
        //                         value: web3.utils.toWei('0.1', 'ether')
        //                 }

        //                 const o = {
        //                         lid: 2
        //                 }
        //                 const tx = await sl.borrow(i.principal, i.term, i.closingWindow, i.ethInterest, i.ethPrice, OFFCHAIN, {from: i.borrower, value: i.value})
        //                 eq(o.lid, await oc(tx, "__borrow", "lid"))
        //         })

        //         it('cannot call payoff if not borrower or admin', async() => {
        //                 const i = {
        //                         lid: 2,
        //                         borrower: admin1
        //                 }

        //                 await u.assertRevert(sl.payoff(i.lid, OFFCHAIN, {from: i.borrower}))
        //         })

        //         it('cannot call payoff if still not reach end time', async() => {
        //                 const i = {
        //                         lid: 2,
        //                         borrower: borrower1
        //                 }

        //                 await u.increaseTime(1)
        //                 await u.assertRevert(sl.payoff(i.lid, OFFCHAIN, {from: i.borrower}))
                        
        //         })

        //         it('cannot call payoff twice', async() => {
        //                 const i = {
        //                         lid: 2,
        //                         borrower: borrower1
        //                 }
        //                 await u.increaseTime(500)
        //                 await sl.payoff(i.lid, OFFCHAIN, {from: i.borrower})
        //                 await u.assertRevert(sl.payoff(i.lid, OFFCHAIN, {from: i.borrower}))
        //         })


        // })

        // describe('liquidate', () => {

        //         before(async () => {
        //                 const i = {
        //                         principal: 1000,
        //                         term: 1,
        //                         closingWindow: 200,
        //                         ethInterest: 360,
        //                         ethPrice: 17630,
        //                         borrower: borrower1,
        //                         value: web3.utils.toWei('0.1', 'ether')
        //                 }

        //                 const o = {
        //                         lid: 3
        //                 }
        //                 const tx = await sl.borrow(i.principal, i.term, i.closingWindow, i.ethInterest, i.ethPrice, OFFCHAIN, {from: i.borrower, value: i.value})
        //                 eq(o.lid, await oc(tx, "__borrow", "lid"))
        //         })

        //         it('cannot send eth to empty liquidator address', async() => {
        //                 const i = {
        //                         lid: 3,
        //                         liquidator: '0x0000000000000000000000000000000000000000',
        //                         admin: root
        //                 }
        //                 await u.assertRevert(sl.liquidate(i.lid, i.liquidator, OFFCHAIN, {from: i.admin}))
        //         })

        //         it('only admin can call it', async() => {
        //                 const i = {
        //                         lid: 3,
        //                         liquidator: liquidator,
        //                         admin: root
        //                 }
        //                 await sl.liquidate(i.lid, i.liquidator, OFFCHAIN, {from: i.admin})
        //         })

        //         it('cannot call payoff then', async() => {
        //                 const i = {
        //                         lid: 3,
        //                         borrower: borrower1
        //                 }

        //                 await u.increaseTime(1000)
        //                 await u.assertRevert(sl.payoff(i.lid, OFFCHAIN, {from: i.borrower}))
        //         })
        // })


        // describe('borrow by admin', () => {

        //         it('init', async () => {
        //                 const i = {
        //                         principal: 1000,
        //                         term: 1,
        //                         closingWindow: 200,
        //                         ethInterest: 360,
        //                         ethPrice: 17630,
        //                         borrower: borrower2,
        //                         value: web3.utils.toWei('0.1', 'ether'),
        //                         admin: root
        //                 }

        //                 const o = {
        //                         lid: 4
        //                 }
        //                 const tx = await sl.borrowByAdmin(i.borrower, i.principal, i.term, i.closingWindow, i.ethInterest, i.ethPrice, OFFCHAIN, {from: i.admin, value: i.value})
        //                 eq(o.lid, await oc(tx, "__borrow", "lid"))

        //                 const loan = await sl.getOpenLoan(o.lid)
        //                 eq(i.principal, loan[0].toNumber())
        //                 eq(i.term, loan[1].toNumber())
        //                 eq(i.borrower, loan[3])
        //         })

        // })
})


contract("SimplePolicy", (accounts) => {
        const root = accounts[0]
        const account = accounts[1]
        const admin = accounts[2]
        const OFFCHAIN = web3.utils.fromAscii('1')

        before(async () => {
                sp = await policy.deployed()
        })

        describe('init contract', () => {

                it('check params', async() => {
                        const i = {
                                ethLTV: web3.utils.fromAscii('ethLTV'),
                                ethLiquidation: web3.utils.fromAscii('ethLiquidation'),
                                ethIncentive: web3.utils.fromAscii('ethIncentive'),
                        }

                        const o = {
                                ethLTV: 6666,
                                ethLiquidation: 1000,
                                ethIncentive: 300,
                        }

                        let value = await sp.current(i.ethLTV)
                        eq(o.ethLTV, value)

                        value = await sp.current(i.ethLiquidation)
                        eq(o.ethLiquidation, value)

                        value = await sp.current(i.ethIncentive)
                        eq(o.ethIncentive, value)
                });

        })

        describe('admin func', () => {

                it('add admin', async() => {
                        const i = {
                                empty: '0x0000000000000000000000000000000000000000',
                                admin: admin,
                                superAdmin: root,
                        }

                        await sp.addAdmin(i.admin, {from: i.superAdmin})
                        await u.assertRevert(sp.addAdmin(i.empty, {from: i.superAdmin}))
                        await u.assertRevert(sp.addAdmin(i.admin, {from: i.admin}))

                });

                it('remove admin', async() => {
                        const i = {
                                empty: '0x0000000000000000000000000000000000000000',
                                admin: admin,
                                superAdmin: root,
                        }

                        await u.assertRevert(sp.removeAdmin(i.empty, {from: i.superAdmin}))
                        await u.assertRevert(sp.removeAdmin(i.admin, {from: i.admin}))
                        await sp.removeAdmin(i.admin, {from: i.superAdmin})

                });

        })


        describe('set param', () => {

                it('only admin', async() => {
                        const i = {
                                ethLTV: web3.utils.fromAscii('ethLTV'),
                                ethLiquidation: web3.utils.fromAscii('ethLiquidation'),
                                ethIncentive: web3.utils.fromAscii('ethIncentive'),
                                admin: root,
                        }

                        const o = {
                                ethLTV: 7000,
                                ethLiquidation: 1200,
                                ethIncentive: 310,
                        }

                        await sp.setParam(i.ethLTV, o.ethLTV, OFFCHAIN, {from: i.admin})
                        let value = await sp.current(i.ethLTV)
                        eq(o.ethLTV, value)

                        await u.assertRevert(sp.setParam(i.ethLTV, 6666, OFFCHAIN, {from: account}))

                        await sp.setParam(i.ethLiquidation, o.ethLiquidation, OFFCHAIN, {from: i.admin})
                        value = await sp.current(i.ethLiquidation)
                        eq(o.ethLiquidation, value)

                        await sp.setParam(i.ethIncentive, o.ethIncentive, OFFCHAIN, {from: i.admin})
                        value = await sp.current(i.ethIncentive)
                        eq(o.ethIncentive, value)
                });

        })

})

contract("Oracle", (accounts) => {
        const root = accounts[0]
        const oracle1 = accounts[1]
        const oracle2 = accounts[2]
        const account3 = accounts[3]
        const OFFCHAIN = web3.utils.fromAscii('1')

        before(async () => {
                or = await oracle.deployed()
        })

        describe('contract', () => {

                it('check params', async() => {
                        const o = {
                                size: 10,
                                frequency: 1,
                        }

                        const frequency = await or.frequency();
                        const size = await or.size();
                        
                        
                        eq(o.size, size)
                        eq(o.frequency, frequency)

                });

                it('add oracle', async() => {
                        await or.addOracle(oracle1, OFFCHAIN, {from: root})
                        await or.addOracle(oracle2, OFFCHAIN, {from: root})

                });

                it('remove oracle', async() => {
                        await or.removeOracle(oracle1, OFFCHAIN, {from: root})
                        await or.removeOracle(oracle2, OFFCHAIN, {from: root})

                });

                it('set size', () => {
                        const i = {
                                admin: root,
                                oracle: 
                        }

                        await u.assertRevert(or.setSize(1, OFFCHAIN, {from: i.admin}))
                        await or.setSize(1, OFFCHAIN, {from: i.admin})

                });


                it('set frequency', () => {


                });


                it('feed data', () => {


                });
                
        })

})