/******************************************************************************
 * Copyright © 2016 The Waves Developers.                                     *
 *                                                                            *
 * See the LICENSE files at                                                   *
 * the top-level directory of this distribution for the individual copyright  *
 * holder information and the developer policies on copyright and licensing.  *
 *                                                                            *
 * Unless otherwise agreed in a custom licensing agreement, no part of the    *
 * Waves software, including this file, may be copied, modified, propagated,  *
 * or distributed except according to the terms contained in the LICENSE      *
 * file.                                                                      *
 *                                                                            *
 * Removal or modification of this copyright notice is prohibited.            *
 *                                                                            *
 ******************************************************************************/
/**
 * @depends {3rdparty/jquery-2.1.0.js}
 * @depends {3rdparty/bootstrap.js}
 * @depends {3rdparty/big.js}
 * @depends {3rdparty/jsbn.js}
 * @depends {3rdparty/jsbn2.js}
 * @depends {3rdparty/webdb.js}
 * @depends {3rdparty/growl.js}
 * @depends {crypto/curve25519.js}
 * @depends {crypto/curve25519_.js}
 * @depends {crypto/base58.js}
 * @depends {crypto/blake32.js}
 * @depends {crypto/keccak32.js}
 * @depends {crypto/passphrasegenerator.js}
 * @depends {crypto/sha256worker.js}
 * @depends {crypto/3rdparty/cryptojs/aes.js}
 * @depends {crypto/3rdparty/cryptojs/sha256.js}
 * @depends {crypto/3rdparty/jssha256.js}
 * @depends {crypto/3rdparty/seedrandom.js}
 * @depends {util/converters.js}
 * @depends {util/extensions.js}
 */
var Waves = (function(Waves, $, undefined) {
	"use strict";

	$("#wavessend").on("click", function(e) {
        e.preventDefault();

        $("#errorpayment").html('');
        var currentBalance = $("#wavesCurrentBalance").val();
        var maxSend = (currentBalance * Math.pow(10,8) ) - 1;
        maxSend = maxSend / Math.pow(10,8);
        var sendAmount = $("#wavessendamount").val().replace(/\s+/g, '');

        if(sendAmount > maxSend) {

            $.growl.error({ message: 'Error: Not enough funds' });
            return;

        }

        var amount = Math.round(Number(sendAmount * 100000000));
        var unmodifiedAmount = Number(sendAmount);

        var senderPassphrase = converters.stringToByteArray(Waves.passphrase);
        var senderPublic = Base58.decode(Waves.publicKey);
        var senderPrivate = Base58.decode(Waves.privateKey);
        var recipient = $("#wavesrecipient").val().replace(/\s+/g, '');

        var wavesTime = Number(Waves.getTime());

        var signature;
        var fee = Number(1);

        var signatureData = Waves.signatureData(Waves.publicKey, recipient, amount, fee, wavesTime);
        var signature = Array.from(Waves.curve25519.sign(senderPrivate, signatureData));
        signature = Base58.encode(signature);

        //var verify = Waves.curve25519.verify(senderPublic, signatureData, Base58.decode(signature));

        var data = {
          "recipient": recipient,
          "timestamp": wavesTime,
          "signature": signature,
          "amount": amount,
          "senderPublicKey": Waves.publicKey,
          "fee": fee
        }

        Waves.apiRequest(Waves.api.waves.broadcastTransaction, JSON.stringify(data), function(response) {

            var fixFee = fee / 100000000;
            if(response.error !== undefined) {
                $.growl.error({ message: 'Error:'+response.error +' - '+response.message });
            } else {

                var successMessage = 'Sent '+Waves.formatAmount(amount)+' Wave to '+recipient.substr(0,10)+'...';
                $.growl({ title: 'Payment sent!', message: successMessage });
                $("#wavesrecipient").val('');
                $("#wavessendamount").val('');

                $.modal.close();
            }

        });

    });

	
	return Waves;
}(Waves || {}, jQuery));