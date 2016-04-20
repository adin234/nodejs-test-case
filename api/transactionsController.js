'use strict';

var Transactions = require( '../models/transactions.model.js' );
var User = require( '../models/user.model.js' );
var config = require( '../config' );
var Stripe = require( 'stripe' )( config.stripeApiKey );

exports.index = function( req, res, next ) {
    if ( req.body ) {
        var transaction = new Transactions( {
            name: req.body.name
        } );
        transaction.save( function( err, trans ) {
            if ( err ) {
                console.log( err );
                return res.status(500).json({success:false, message:err});
            }
            res.status( 200 ).end();
        } );
    }
};

exports.createTransaction = function( req, res, next ) {
    var name = req.decoded._doc.name;
    var amount = req.body.amount;
    var currency = req.body.currency;

    User.findOne( {
        name: name
    }, function( err, user ) {

        if ( err ) {
            return res.status(500).json({success: false, message:err});
        }

        if ( user ) {
            if (!user.stripe_customer_id.trim().length || req.body.token) {
                return Stripe.customers.create({
                    source: req.body.token,
                    description: user.name
                }).then(function (customer) {
                    user.stripe_customer_id = customer.id;
                    if (!user.stripe_customer_id.trim().length) {
                        User.update({name:user.name}, {stripe_customer_id: customer.id}, function (err, doc) {
                            
                        });
                    }

                    return charge(amount, currency, customer.id);
                });
            }

            return charge(amount, currency, user.stripe_customer_id);

        }

        res.status(404).json({success: false, message: 'User not found'});
    });

    function charge (amount, currency, customer_id) {
        Stripe.charges.create({
            amount: amount,
            currency: currency,
            customer: customer_id
        }, function( err, charge ) {
            if ( err ) {
                console.log( err );
                return res.status(500).json({success:false, message:err});
            }
            var transaction = new Transactions( {
                transactionId: charge.id,
                amount: charge.amount,
                created: charge.created,
                currency: charge.currency,
                description: charge.description,
                paid: charge.paid,
                sourceId: charge.source.id
            } );

            transaction.save( function( err ) {
                    if ( err ) {
                        console.log( err );
                        return res.status(500).json({success:false, message:err});
                    }
                    else {
                        res.status( 200 ).json( {
                            message: 'Payment is created.'
                        } );
                    }
                } );
                // asynchronously called
        });
    }
};

