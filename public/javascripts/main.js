'use strict';

/*global Stripe:true*/
/*global $form:true*/

//set Public key for Stripe payments
Stripe.setPublishableKey( 'pk_test_jfseqXB1Y2GCKmVLA5bVRH5B' );
var isSubmit = false;
$( document ).ready( function() {
    function charge_user ( status, response ) {
        if ( response.error ) {
            // Show the errors on the form
            $('#error').removeClass('alert-success').addClass('alert-danger');
            $( '.payment-errors' ).text( response.error.message );
            $('#error').show();
        }
        else {
            // response contains id and card, which contains additional card details
            var token = response.id;
            // Insert the token into the form so it gets submitted to the server
            //$form.append( $( '<input type="hidden" name="stripeToken" />' ).val( token ) );
            // and submit
            $.ajax( {
                url: '/createtransaction',
                type: 'POST',
                headers: {
                    'x-access-token': $( '#token' ).html()
                },
                data: {
                    amount: $( '#amount' ).val(),
                    currency: $( '#currency' ).val(),
                    token: token
                }
            } ).done( function( response ) {
                if ( response.message ) {
                    $( '.payment-errors' ).text( response.message );
                    $('#error').removeClass('alert-danger').addClass('alert-success');
                    $('#error').show();
                }
            } ).fail (function ( response ) {
                response = response.responseJSON;

                if ( response.message ) {
                    $( '.payment-errors' ).text( response.message );
                    $('#error').removeClass('alert-success').addClass('alert-danger');
                    if (response.message.message) {
                        $( '.payment-errors' ).text( response.message.message );
                    }
                    $('#error').show();
                }
            });
        }

    }

    $( '#submittransaction' ).click( function() {
        $('#error').hide();
        if ( !isSubmit ) {
            if (!$('#useSaved:checked').length) {
                return Stripe.card.createToken( {
                    number: $( '#cardnumber' ).val(),
                    cvc: $( '#card-cvc' ).val(),
                    exp_month: $( '#card-expiry-month' ).val(),
                    exp_year: $( '#card-expiry-year' ).val()
                }, charge_user);
            }

            charge_user ({}, {});
        }

    } );

    $('#useSaved').click(function (e) {
        $('.card-info').toggleClass('hide');
    });
} );
