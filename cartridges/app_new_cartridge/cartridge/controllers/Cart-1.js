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
            amountThreshold = currentBasket.getMerchandizeTotalNetPrice().decimalValue;
           if (amountThreshold >= TOTAL_AMOUNT_THRESHOLD) {
                totalAmountThreshold = TOTAL_AMOUNT_THRESHOLD;
            }
        });
    }

    res.render('cart/cart', { totalAmountThreshold: totalAmountThreshold});

    return next();

});

// Add sending email feature when user add product to cart
server.append('AddProduct', server.middleware.https,
csrfProtection.validateAjaxRequest, function (req, res, next) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');

    var productModel = req.getViewData();

    res.setViewData(productModel);
    this.on('route:BeforeComplete', function (req, res) {
        var prodObj = {product: productModel};
        var emailObj = {
            to: 'ada.xie@yandex.com',
            subject: Resource.msg('subject.addproduct.confirmation.email', 'cart', null),
            from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
            type: emailHelpers.emailTypes.orderConfirmation
        };
        emailHelpers.sendEmail(emailObj, 'cart/addToCartEmail', prodObj);
    });

    next();

});

    module.exports = server.exports();





