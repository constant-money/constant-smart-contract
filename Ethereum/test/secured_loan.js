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
                                size: 1,
                                frequency: 1,
                        }

                        const tx = await or.data();
                        const size = tx[0].toNumber();
                        const frequency = tx[1].toNumber();

                        eq(o.size, size);
                        eq(o.frequency, frequency);

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
                        await c.purchase(borrower1, 10000, OFFCHAIN, {from: i.root});
                        await c.purchase(borrower2, 10000, OFFCHAIN, {from: i.root});

                        const bal = await c.balanceOf(c.address);
                        eq(o.value, bal.toNumber());
                        eq(10000, await c.balanceOf(borrower1));
                        eq(10000, await c.balanceOf(borrower2));

                })

                it('approve CONST', async () => {
                        await c.approve(sl.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", { from: borrower1 });
                        await c.approve(sl.address, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", { from: borrower2 });

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
                                amount: 1000, // 10US
                                admin: root,
                                collateral: web3.utils.toWei('0.1', 'ether'), 
                        }

                        const o = {
                                oid: 0,
                        }

                        await u.assertRevert(sl.borrow(i.borrower, i.term, i.rate, i.collateral, i.amount, OFFCHAIN, {from: i.borrower}));
                        const tx = await sl.borrow(i.borrower, i.term, i.rate, i.collateral, i.amount, OFFCHAIN, {from: i.admin});
                        eq(o.oid, await oc(tx, "__borrow", "oid"));
                })


                it('borrower 2 cannot create loan', async() => {
                        const i = {
                                borrower: borrower2,
                                term: 1,
                                rate: 10,
                                amount: 100000, // 1000US
                                admin: root,
                                collateral: web3.utils.toWei('0.1', 'ether'),
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
                                collateral: web3.utils.toWei('0.058', 'ether'),
                                term: 1,
                                rate: 10,
                                onchain: false,
                                admin: account,
                        }

                        await u.assertRevert(sl.fill(i.oid, i.lender, i.principal, i.collateral, i.term, i.rate, i.onchain, OFFCHAIN, {from: i.admin}));
                        
                })

                it('fill 1st', async() => {

                        const i = {
                                oid: 0,
                                lender: c.address,
                                principal: 100, // 1US
                                collateral: web3.utils.toWei('0.058', 'ether'),
                                term: 2678400,
                                rate: 1000, // 10%
                                onchain: false,
                                admin: root,
                        }

                        const o = {
                                lid: 0,
                                borrower: borrower1,
                        }

                        const tx = await sl.fill(i.oid, i.lender, i.principal, i.collateral, i.term, i.rate, i.onchain, OFFCHAIN, {from: i.admin});
                        eq(o.lid, await oc(tx, '__fill', 'lid'));
                        
                })

                it('fill 2st', async() => {
                        const i = {
                                oid: 0,
                                lender: c.address,
                                principal: 900, // 9US
                                collateral: web3.utils.toWei('0.042', 'ether'),
                                term: 2678400,
                                rate: 1000, // 10%
                                onchain: false,
                                admin: root,
                        }

                        const o = {
                                lid: 1,
                                borrower: borrower1,
                        }

                        const tx = await sl.fill(i.oid, i.lender, i.principal, i.collateral, i.term, i.rate, i.onchain, OFFCHAIN, {from: i.admin});
                        eq(o.lid, await oc(tx, '__fill', 'lid'));
                        
                })

                it('cannot able to fill when full matched', async() => {
                        const i = {
                                oid: 0,
                                lender: c.address,
                                principal: 10, // 0.1US
                                collateral: web3.utils.toWei('0.001', 'ether'),
                                term: 2678400,
                                rate: 1000, // 10%
                                onchain: false,
                                admin: root,
                        }

                        await u.assertRevert(sl.fill(i.oid, i.lender, i.principal, i.collateral, i.term, i.rate, i.onchain, OFFCHAIN, {from: i.admin}));

                })


        })

        describe('withdraw remaining amount', () => {

                before(async () => {
                        const i = {
                                deposit: web3.utils.toWei('0.1', 'ether'),
                                borrower: borrower2,
                        }

                        const o = {
                                balance: web3.utils.toWei('0.2', 'ether'), // 0.1 borrower1 + 0.1 borrower2
                        }

                        await sl.send(i.deposit, {from: i.borrower});
                        const balance = await web3.eth.getBalance(sl.address);
                        
                        eq(o.balance, balance);
                })

                it('borrow', async() => {
                        
                        const i = {
                                borrower: borrower1,
                                term: 2678400,
                                rate: 1000, // 10%
                                amount: 1000, // 10US
                                admin: root,
                                collateral: web3.utils.toWei('0.09', 'ether'),
                        }

                        const o = {
                                oid: 1,
                        }

                        await u.assertRevert(sl.borrow(i.borrower, i.term, i.rate, i.collateral, i.amount, OFFCHAIN, {from: i.borrower}));
                        const tx = await sl.borrow(i.borrower, i.term, i.rate, i.collateral, i.amount, OFFCHAIN, {from: i.admin});
                        eq(o.oid, await oc(tx, "__borrow", "oid"));

                })

                it('cancel', async() => {

                        const i = {
                                oid: 1,
                                borrower: borrower1,
                        }

                        const o = {
                                balance: web3.utils.toWei('0.11', 'ether'),
                        }

                        await sl.cancel(i.oid, OFFCHAIN, {from: i.borrower});
                        const balance = await web3.eth.getBalance(sl.address);

                        eq(o.balance, balance);
                })

                it('withdraw', async() => {
                        
                        const i = {
                                borrower: borrower2,
                                admin: root,
                        }

                        const o = {
                                balance: web3.utils.toWei('0.1', 'ether'),
                        }

                        await u.assertRevert(sl.withdraw(i.borrower, OFFCHAIN, {from: i.borrower}));

                        await sl.withdraw(i.borrower, OFFCHAIN, {from: i.admin});
                        const balance = await web3.eth.getBalance(sl.address);
                        eq(o.balance, balance);
                })


                it('cannot fill anymore', async() => {
                        const i = {
                                oid: 1,
                                lender: c.address,
                                principal: 10, // 0.1US
                                collateral: web3.utils.toWei('0.001', 'ether'),
                                term: 2678400,
                                rate: 1000, // 10%
                                onchain: false,
                                admin: root,
                        }

                        await u.assertRevert(sl.fill(i.oid, i.lender, i.principal, i.collateral, i.term, i.rate, i.onchain, OFFCHAIN, {from: i.admin}));
                })

        })

        describe('1. repay > borrower defaults', () => {

                before(async () => {
                        const i = {
                                deposit: web3.utils.toWei('0.5', 'ether'),
                                borrower: borrower1,
                        }

                        const o = {
                                balance: web3.utils.toWei('0.6', 'ether'), // 0.2 borrower1
                        }

                        await sl.send(i.deposit, {from: i.borrower});
                        const balance = await web3.eth.getBalance(sl.address);
                        
                        eq(o.balance, balance);
                })


                it('borrower1 init borrow', async() => {

                        const i = {
                                borrower: borrower1,
                                term: 2678400,
                                rate: 1000, // 10%
                                amount: 3000, // 30US
                                admin: root,
                                collateral: web3.utils.toWei('0.3', 'ether'),
                        }

                        const o = {
                                oid: 2,
                        }

                        await u.assertRevert(sl.borrow(i.borrower, i.term, i.rate, i.collateral, i.amount, OFFCHAIN, {from: i.borrower}));
                        const tx = await sl.borrow(i.borrower, i.term, i.rate, i.collateral, i.amount, OFFCHAIN, {from: i.admin});
                        eq(o.oid, await oc(tx, "__borrow", "oid"));

                })


                it('fill order', async () => {
                        const i = {
                                oid: 2,
                                lender: c.address,
                                principal: 1000, // 10US
                                collateral: web3.utils.toWei('0.1', 'ether'),
                                term: 2678400,
                                rate: 1000, // 10%
                                onchain: false,
                                admin: root,
                        }

                        const o = {
                                lid: 2,
                        }

                        const tx = await sl.fill(i.oid, i.lender, i.principal, i.collateral, i.term, i.rate, i.onchain, OFFCHAIN, {from: i.admin});
                        eq(o.lid, await oc(tx, "__fill", "lid"));

                })


                it('repay', async () => {

                        const i = {
                                borrower: borrower1,
                                lid: 2,
                                onchain: false,
                                admin: root,
                        }
        
                        await u.assertRevert(sl.repayByAdmin(i.borrower, i.lid, i.onchain, OFFCHAIN, {from: i.admin}));

                        const balBefore = await web3.eth.getBalance(i.borrower);

                        u.increaseTime(2678400)
                        const tx = await sl.repayByAdmin(i.borrower, i.lid, i.onchain, OFFCHAIN, {from: i.admin});
                        const collateralAmt = await oc(tx, "__repay", "collateral");
                        const balAfter = await web3.eth.getBalance(i.borrower);


                        eq(parseFloat(web3.utils.fromWei(balAfter, 'ether')), parseFloat(web3.utils.fromWei(collateralAmt, 'ether')) + parseFloat(web3.utils.fromWei(balBefore, 'ether')));
                        

                })
        })


        describe('2. repay > collateral current drops', () => {


        })


        describe('3. collateral current go up to legendary', () => {

                

        })


        describe('payoff', () => {

                it('fill', async () => {

                        const i = {
                                oid: 2,
                                lender: c.address,
                                principal: 100, // 1US
                                collateral: web3.utils.toWei('0.01', 'ether'),
                                term: 2678400,
                                rate: 1000, // 10%
                                onchain: false,
                                admin: root,
                        }


                        const o = {
                                lid: 3,
                        }


                        const tx = await sl.fill(i.oid, i.lender, i.principal, i.collateral, i.term, i.rate, i.onchain, OFFCHAIN, {from: i.admin});
                        eq(o.lid, await oc(tx, "__fill", "lid"));
                })


                it('admin call payoff > wrong borrower address', async () => {

                        const i = {
                                lid: 3,
                                borrower: borrower2,
                                admin: root,
                        }

                        await u.assertRevert(sl.payoffByAdmin(i.lid, i.borrower, false, OFFCHAIN, {from: i.admin}));
                        await u.assertRevert(sl.payoffByAdmin(i.lid, i.borrower, true, OFFCHAIN, {from: i.admin}));
                })


                it('borrower call payoff', async () => {

                        const i = {
                                lid: 3,
                                borrower: borrower1,
                        }

                        const o = {
                                fee: 500,
                        }

                        u.increaseTime(10000);

                        await u.assertRevert(sl.payoff(i.lid, OFFCHAIN, {from: borrower2}));
                        
                        const tx = await sl.payoff(i.lid, OFFCHAIN, {from: i.borrower});
                        const fee = await oc(tx, "__payoff", "fee");
                        eq(o.fee, fee);
                })

        })

})