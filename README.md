Nano Sales - Payment Gateway Helper
===================================

**WARNING: this project uses `yarn`**

This payment gateway helper is configured with three files:

`wallet.seed` is this server's private key, it is used to generate addresses for the address pool and to sign transactions for settling. If file is not provided it will generate a random seed at startup.

`settle.pub` is the shop's settlement address, it is where this server will send the collected funds when addresses are released. If one is not provided the payments will never settle and new addresses will be generated new payments.

`config.json` is a file with the follwing structure:

```
{
    "minPoolAddresses": 5, //minimum number of addresses to be generated by the pool
    "nodeWs": "wss://localnode:7078",
    "nodeRpc": "https://localnode"
}
```

Three simple http endpoints:

## POST /sales

This endpoint creates/allocates an address for the payment, registering a callback url and a desired amount.

The shop receives back the address.

Once any block is confirmed for that address the callback is called via GET, no payload.

*Input:*

```
{
    "callback": "my.shop/update-payment/123", // unique url for updating a payment status
    "amount": 1000000000000000000000000000000 // amount in RAW (1 nano)
}
```

*Output:*

```
{
    "address": "nano_3oneTimeDepositAddressToDisplayAtTheCheckoutPage111111111111"
}
```

## GET /sales/nano_3oneTimeDepositAddressToDisplayAtTheCheckoutPage111111111111

This endpoint informs the shop about the payment status, it is meant to be called right after the shop receives a callback. Meaning the shop must store the address for that order on their side.

*Output:*

```
{
    "paid": false, // boolean that indicates if balance is greater or equal than amount
    "amount": 1000000000000000000000000000000,
    "balance": 990000000000000000000000000000
}
```

## DELETE /sales/nano_3oneTimeDepositAddressToDisplayAtTheCheckoutPage111111111111

Once payment is confirmed on the shop it can release the address and settle the balance on their main address.
It is recommended that uppon settlement the address is removed from the shop's order information to avoid mix ups.
This software will generate logs for every transaction.

# BUILDING

`yarn tsc`

# RUNNING

`node dist/index.js`