#include "constant.hpp"

void constant::purchase(name to, asset quantity)
{
    auto sym = quantity.symbol;
    eosio_assert(sym.is_valid(), "invalid symbol name");

    stats statstable( _self, sym.code().raw() );
    auto existing = statstable.find( sym.code().raw() );
    eosio_assert( existing != statstable.end(), "token with symbol does not exist, create token before issue" );
    const auto& st = *existing;

    eosio_assert(_self == st.issuer, "must be owner of this contract");
    require_recipient(to);

    eosio_assert(quantity.is_valid(), "invalid quantity");
    eosio_assert(quantity.amount >= 0, "must issue positive quantity or zero");
    eosio_assert(quantity.symbol == st.supply.symbol, "symbol precision mismatch");

    add_balance(to, quantity, _self);

    statstable.modify(st, _self, [&]( auto& s ) {
        s.supply += quantity;
    });
}

void constant::redeem(name from, asset quantity)
{
    auto sym = quantity.symbol;
    eosio_assert(sym.is_valid(), "invalid symbol name");

    stats statstable( _self, sym.code().raw() );
    auto existing = statstable.find( sym.code().raw() );
    eosio_assert( existing != statstable.end(), "token with symbol does not exist, create token before issue" );
    const auto& st = *existing;

    eosio_assert(_self == st.issuer, "must be owner of this contract");
    eosio_assert(st.supply.amount >= quantity.amount, "vault must be large than 0");

    require_recipient(from);

    eosio_assert(quantity.is_valid(), "invalid quantity");
    eosio_assert(quantity.amount >= 0, "must issue positive quantity or zero");
    eosio_assert(quantity.symbol == st.supply.symbol, "symbol precision mismatch");

    sub_balance(from, quantity);

    statstable.modify(st, _self, [&]( auto& s ) {
        s.supply -= quantity;
    });
}

void constant::transfer(name from, name to, asset quantity, string memo)
{
    require_recipient(from);

    eosio_assert(from != to, "cannot transfer to self" );
    eosio_assert(is_account(to), "to account does not exist");

    auto sym = quantity.symbol;
    eosio_assert(sym.is_valid(), "invalid symbol name");

    stats statstable(_self, sym.code().raw());
    auto existing = statstable.find( sym.code().raw() );
    eosio_assert( existing != statstable.end(), "token with symbol does not exist, create token before issue" );
    const auto& st = *existing;

    require_recipient(to);
    eosio_assert(_self == st.issuer, "must be owner of this contract");
    eosio_assert(quantity.is_valid(), "invalid quantity" );
    eosio_assert(quantity.amount > 0, "must transfer positive quantity" );
    eosio_assert(quantity.symbol == st.supply.symbol, "symbol precision mismatch" );
    eosio_assert(memo.size() <= 256, "memo has more than 256 bytes");

    sub_balance(from, quantity);
    add_balance(to, quantity, _self);
}

void constant::sub_balance(name owner, asset value) {
    accounts to_acnts(_self, owner.value);
    auto to = to_acnts.find(value.symbol.code().raw());
    eosio_assert(to != to_acnts.end(), "must hold CONST");
    
    to_acnts.modify(to, owner, [&]( auto& a ) {
        a.balance -= value;
    });
    
}

void constant::add_balance(name owner, asset value, name ram_payer)
{
    accounts to_acnts(_self, owner.value);
    auto to = to_acnts.find(value.symbol.code().raw());
    if(to == to_acnts.end()) {
        to_acnts.emplace(ram_payer, [&]( auto& a ){
            a.balance = value;
        });
    } else {
        to_acnts.modify(to, ram_payer, [&]( auto& a ) {
            a.balance += value;
        });
    }
}

EOSIO_DISPATCH(constant, (purchase)(redeem)(transfer))