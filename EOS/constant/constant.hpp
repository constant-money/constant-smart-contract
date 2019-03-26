/**
 *  @file
 *  @copyright defined in eos/LICENSE.txt
 */
#pragma once

#include <eosiolib/symbol.hpp>
#include <eosiolib/asset.hpp>
#include <eosiolib/eosio.hpp>
#include <string>

using namespace std;
using namespace eosio;

class [[eosio::contract("constant")]] constant : public contract
{
public:
    using contract::contract;

    constant(name receiver, name code, datastream<const char*> ds):contract(receiver, code, ds) {
        // create constant here
        require_auth(code);

        string s = "CONST";
        symbol sym = symbol(s.c_str(), 2);
        asset maximum_supply = asset(0, sym);
        
        stats statstable(code, sym.code().raw());
        auto existing = statstable.find(sym.code().raw());
        if (existing == statstable.end()) {
            statstable.emplace(_self, [&](auto &s) {
                s.supply.symbol = maximum_supply.symbol;
                s.issuer = code;
            });
            send_summary(_self, "create CONST successfully!");
        
        }
    }

    [[eosio::action]]
    void version();

    [[eosio::action]]
    void purchase(name to, asset quantity);

    [[eosio::action]]
    void redeem(name from, asset quantity);

    [[eosio::action]]
    void transfer(name from, name to, asset quantity, string memo);

    [[eosio::action]]
    void notify(name user, string msg);

    static asset get_supply(name token_contract_account, symbol_code sym_code)
    {
        stats statstable(token_contract_account, sym_code.raw());
        const auto &st = statstable.get(sym_code.raw());
        return st.supply;
    }

    static asset get_balance(name token_contract_account, name owner, symbol_code sym_code)
    {
        accounts accountstable(token_contract_account, owner.value);
        const auto &ac = accountstable.get(sym_code.raw());
        return ac.balance;
    }

private:
    struct [[eosio::table]] account
    {
        asset balance;
        uint64_t primary_key() const { return balance.symbol.code().raw(); }
    };

    struct [[eosio::table]] currency_stats
    {
        asset supply;
        name issuer;
        uint64_t primary_key() const { return supply.symbol.code().raw(); }
    };

    typedef eosio::multi_index<"accounts"_n, account> accounts;
    typedef eosio::multi_index<"stat"_n, currency_stats> stats;

    void sub_balance(name owner, asset value);
    void add_balance(name owner, asset value, name ram_payer);
    void send_summary(name user, string message);
};
