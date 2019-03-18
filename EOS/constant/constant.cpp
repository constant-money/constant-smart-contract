#include "constant.hpp"

void constant::version()
{
    send_summary(_self, "constant version 1.0.0");
}

void constant::purchase(name to, asset quantity)
{
    auto sym = quantity.symbol;
    eosio_assert(sym.is_valid(), "invalid symbol name");

    stats statstable( _self, sym.code().raw() );
    auto existing = statstable.find( sym.code().raw() );
    eosio_assert( existing != statstable.end(), "token with symbol does not exist, create token before issue" );
    const auto& st = *existing;

    eosio_assert(_self == st.issuer, "must owner of this contract");
    require_auth(to);
    require_recipient(to);

    eosio_assert(quantity.is_valid(), "invalid quantity");
    eosio_assert(quantity.amount >= 0, "must issue positive quantity or zero");
    eosio_assert(quantity.symbol == st.supply.symbol, "symbol precision mismatch");

    add_balance(to, quantity, _self);
}

void constant::redeem(name from, asset quantity)
{
}

void constant::transfer(name from, name to, asset quantity)
{
}

void constant::sub_balance(name owner, asset value) {

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

void constant::notify(name user, string msg) {
    require_auth(_self);

    require_auth(user);
    require_recipient(user);
}

void constant::send_summary(name user, string message) {
    action(
        permission_level{get_self(),"active"_n}, // permission level
        _self, // code
        "notify"_n, // action
        make_tuple(user, message) // data
    ).send();
}

EOSIO_DISPATCH(constant, (version)(purchase)(redeem)(transfer)(notify))