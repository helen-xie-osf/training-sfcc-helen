'use strict';

var server = require('server');
var controller = require('app_storefront_base/cartridge/controllers/Cart');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.append(
    'Show',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {

    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var currentBasket = BasketMgr.getCurrentBasket();
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    const TOTAL_AMOUNT_THRESHOLD = 200;
    var totalAmountThreshold = 0;
    var amountThreshold;
    if(currentBasket){
        Transaction.wrap(function () {
            amountThreshold = currentBasket.getMerchandizeTotalNetPrice().value;
           if (amountThreshold >= TOTAL_AMOUNT_THRESHOLD) {
                totalAmountThreshold = TOTAL_AMOUNT_THRESHOLD;
            }
        });
    }

    res.render('cart/cart', { totalAmountThreshold: totalAmountThreshold});

    return next();

});

    module.exports = server.exports();





