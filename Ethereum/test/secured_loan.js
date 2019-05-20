const constant = artifacts.require("Constant")
const policy = artifacts.require("SimplePolicy")
const oracle = artifacts.require("Oracle")
const p2p = artifacts.require("SecuredLoan")


const eq = assert.equal
const u = require('./util.js')
const oc = u.oc
let sl, sp, or, c;


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
        const account = accounts[3]
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

                        const tx = await or.data();
                        const size = tx[0].toNumber();
                        const frequency = tx[1].toNumber();

                        eq(10, size);
                        eq(1, frequency);

                });
                
        })


        describe('manage oracle', () => {

                it('add oracle', async() => {
                        await or.addOracle(oracle1, OFFCHAIN, {from: root});
                        await or.addOracle(oracle2, OFFCHAIN, {from: root});

                });

                it('remove oracle', async() => {
                        await or.removeOracle(oracle1, OFFCHAIN, {from: root});
                        await or.removeOracle(oracle2, OFFCHAIN, {from: root});

                });

        })


        describe('manage size', () => {

                it('set size', async () => {
                        const i = {
                                admin: root,
                                oracle: oracle1,
                        }
        
                        await or.addOracle(i.oracle, OFFCHAIN, {from: root});
                        await u.assertRevert(or.setSize(1, OFFCHAIN, {from: account}));
                        await u.assertRevert(or.setSize(1, OFFCHAIN, {from: i.oracle}));

                        await or.setSize(2, OFFCHAIN, {from: i.admin});

                        const tx = await or.data();
                        const size = tx[0].toNumber();
                        eq(2, size);
        
                });

        })


        describe('manage frequency', () => {

                it('set frequency', async () => {
                        const i = {
                                admin: root,
                                oracle: oracle1,
                        }
        
                        await u.assertRevert(or.setFrequency(1, OFFCHAIN, {from: account}));
                        await u.assertRevert(or.setFrequency(1, OFFCHAIN, {from: i.oracle}));

                        await or.setFrequency(2, OFFCHAIN, {from: i.admin});
                        const tx = await or.data();
                        const frequency = tx[1].toNumber();
                        eq(2, frequency);
                });

        })

        describe('feed data', () => {

                it('feed ethPrice', async () => {
                        const i = {
                                key: web3.utils.fromAscii('ethPrice'),
                                value: 18684, // 186.84 US
                                oracle: oracle1,
                        }

                        const o = {
                                value: 18684,
                        }
        
                        await or.feed(i.key, i.value, OFFCHAIN, {from: i.oracle});
                        await u.assertRevert(or.feed(i.key, i.value, OFFCHAIN, {from: root}));

                        const tx = await or.current(i.key, {from: i.oracle});
                        const value = tx.toNumber();
                        eq(value, o.value);
                });

        })
        

        describe('current data', () => {

                it('ethPrice', async () => {
                        const i = {
                                key: web3.utils.fromAscii('ethPrice'),
                                value: 19600, // 196.00 US
                                oracle: oracle1,
                        }

                        const o = {
                                value: 19600, // 196.00 US
                        }
        
                        // feed more data
                        u.increaseTime(10)
                        await or.feed(i.key, i.value, OFFCHAIN, {from: i.oracle});
                        const tx = await or.current(i.key, {from: i.oracle});
                        const value = tx.toNumber();
                        eq(value, o.value);
                });

        })

})

contract("SecuredLoan", (accounts) => {
        const root = accounts[0]
        const oracle1 = accounts[1]
        const borrower1 = accounts[2]
        const borrower2 = accounts[3]
        const admin1 = accounts[4]
        const account = accounts[5]

        const OFFCHAIN = web3.utils.fromAscii('1')

        before(async () => {
                sp = await policy.deployed();
                or = await oracle.deployed();
                c = await constant.deployed();

                sl = await p2p.deployed(sp.address, or.address, c.address);
        })


        describe('init contract', () => {

                it('mint CONST', async() => {

                        const i = {
                                root: root,
                                value: 1000000, //10000 CONST
                        }

                        const o = {
                                value: 1000000, //10000 CONST
                        }

                        await c.purchase(c.address, i.value, OFFCHAIN, {from: i.root});

                        const bal = await c.balanceOf(c.address);
                        eq(o.value, bal.toNumber());

                })

                it('deposit ether', async() => {
                        const i = {
                                deposit: web3.utils.toWei('0.1', 'ether'),
                                borrower: borrower1,
                        }

                        await sl.send(i.deposit, {from: i.borrower})
                })


                it('add oracle', async() => {
                        await or.addOracle(oracle1, OFFCHAIN, {from: root});
                })


                it('feed data for oracle', async() => {
                        const i = {
                                key: web3.utils.fromAscii('ethPrice'),
                                value: 19600, // 196.00US
                                oracle: oracle1,
                        }


                        await or.feed(i.key, i.value, OFFCHAIN, {from: i.oracle});
                })


                it('feed param for policy', async() => {
                        const i = {
                                key: web3.utils.fromAscii('ethLegendary'),
                                value: 2000, // 20%
                                admin: root,
                        }

                        const o = {
                                value: 2000,
                        }


                        await sp.setParam(i.key, i.value, OFFCHAIN, {from: i.admin});
                        const tx = await sp.current(i.key, {from: i.admin});
                        eq(o.value, tx.toNumber());

                })

        })


        describe('add admin', () => {

                it('failed if address is empty', async() => {
                        const i = {
                                address: '0x0000000000000000000000000000000000000000',
                                admin: root
                        }

                        await u.assertRevert(sl.addAdmin(i.address, {from: i.admin}))
                });


                it('borrower call it', async() => {
                        const i = {
                                address: admin1,
                                admin: borrower1
                        }
                        await u.assertRevert(sl.addAdmin(i.address, {from: i.admin}))
                });

                it('only admin can call it', async() => {
                        const i = {
                                address: admin1,
                                admin: root
                        }
                        await sl.addAdmin(i.address, {from: i.admin})
                });

        })


        describe('remove admin', () => {

                it('failed if address is empty', async() => {
                        const i = {
                                address: '0x0000000000000000000000000000000000000000',
                                admin: root
                        }

                        await u.assertRevert(sl.removeAdmin(i.address, {from: i.admin}))
                });


                it('borrower call it', async() => {
                        const i = {
                                address: admin1,
                                admin: borrower1
                        }
                        await u.assertRevert(sl.removeAdmin(i.address, {from: i.admin}))
                });

                it('only admin can call it', async() => {
                        const i = {
                                address: admin1,
                                admin: root
                        }
                        await sl.removeAdmin(i.address, {from: i.admin})
                });

        })

        describe('borrow', () => {

                it('get principal', async() => {
                        const i = {
                                collateral: 1,
                        }

                        const o = {
                                value: 13065, // 130.65US
                        }

                        const tx = await sl.principal(i.collateral, {from: root});
                        eq(o.value, tx.toNumber());

                })

                it('borrower 1 create loan', async() => {
                        const i = {
                                borrower: borrower1,
                                term: 2678400,
                                rate: 1000, // 10%
                                amount: 100, // 1US
                                admin: root,
                                collateral: 5800000000000000, // 0.058 ether
                        }

                        const o = {
                                oid: 0,
                                collateral: 5800000000000000, // 0.058 ether
                        }

                        await u.assertRevert(sl.borrow(i.borrower, i.term, i.rate, i.collateral, i.amount, OFFCHAIN, {from: i.borrower}));
                        const tx = await sl.borrow(i.borrower, i.term, i.rate, i.collateral, i.amount, OFFCHAIN, {from: i.admin});
                        eq(o.oid, await oc(tx, "__borrow", "oid"));

                        const collateral = await oc(tx, '__borrow', 'collateral');
                        eq(o.collateral, collateral);
                })


                it('borrower 2 cannot create loan', async() => {
                        const i = {
                                borrower: borrower2,
                                term: 1,
                                rate: 10,
                                amount: 100000, // 1000US
                                admin: root,
                                collateral: 1,
                        }

                        await u.assertRevert(sl.borrow(i.borrower, i.term, i.rate, i.collateral, i.amount, OFFCHAIN, {from: i.admin}));
                })


        })        

        describe('fill - onchain always is false', () => {

                it('only admin', async() => {

                        const i = {
                                oid: 0,
                                lender: c.address,
                                principal: 1000, // 10US
                                collateral: 1,
                                term: 1,
                                rate: 10,
                                onchain: false,
                                admin: account,
                        }

                        const o = {
                                borrower: borrower1,
                        }

                        await u.assertRevert(sl.fill(i.oid, i.lender, i.principal, i.collateral, i.term, i.rate, i.onchain, OFFCHAIN, {from: i.admin}));
                        
                })

                it('fill 1st', async() => {

                        const i = {
                                oid: 0,
                                lender: c.address,
                                principal: 100, // 1US
                                collateral: 5800000000000000, // 0.058 ether
                                term: 2678400,
                                rate: 1000, // 10%
                                onchain: false,
                                admin: root,
                        }

                        await sl.fill(i.oid, i.lender, i.principal, i.collateral, i.term, i.rate, i.onchain, OFFCHAIN, {from: i.admin});
                        
                })

                it('fill 2st', async() => {
                        
                        
                })

                it('cannot able to fill when full matched', async() => {
                       
                })


        })

        describe('withdraw remaining amount', () => {

        })

        describe('repay > borrower repays early', () => {

                before(async () => {

                })

        })



        describe('repay > borrower defaults', () => {


        })


        describe('repay > collateral current drops', () => {

        })


        describe('repay > collateral current go up (if value exceeds x%)', () => {

                

        })

})