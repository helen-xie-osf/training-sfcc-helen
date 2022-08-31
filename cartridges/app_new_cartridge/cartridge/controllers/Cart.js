'use strict';

/**
 * @namespace Cart
 */

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

/**
 * Cart-AddProduct : The Cart-MiniCart endpoint is responsible for displaying the cart icon in the header with the number of items in the current basket
 * @name Base/Cart-AddProduct
 * @function
 * @memberof Cart
 * @param {httpparameter} - pid - product ID
 * @param {httpparameter} - quantity - quantity of product
 * @param {httpparameter} - options - list of product options
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace('AddProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');


    // for email feature
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');

    var emailObj = {
        to: 'ada.xie@yandex.com',
        subject: Resource.msg('subject.addproduct.confirmation.email', 'cart', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.orderConfirmation
    };


    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var previousBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();
    var productId = req.form.pid;
    var childProducts = Object.hasOwnProperty.call(req.form, 'childProducts')
        ? JSON.parse(req.form.childProducts)
        : [];
    var options = req.form.options ? JSON.parse(req.form.options) : [];
    var quantity;
    var result;
    var pidsObj;
    // for email feature
    var prodsObj = [];

    if (currentBasket) {
        Transaction.wrap(function () {
            if (!req.form.pidsObj) {
                quantity = parseInt(req.form.quantity, 10);
                result = cartHelper.addProductToCart(
                    currentBasket,
                    productId,
                    quantity,
                    childProducts,
                    options
                );
                // email elements
                var product = ProductMgr.getProduct(productId);
                var optionModel = productHelper.getCurrentOptionModel(product.optionModel, options);

                var prodObj = {
                    productId: productId,
                    product: product,
                    productName: product.getName(),
                    productUrl: product.getPageURL(),
                    imageUrl: product.getImage('large', 0).getHttpImageURL({scaleWidth: 300, format: 'jpg'}),
                    imageAlt: product.getImage('large', 0).getAlt(),
                    productPrice: product.getPriceModel().getPrice().decimalValue,
                    quantity: quantity,
                    productDescription: product.getShortDescription(),
                    childProducts: childProducts,
                    optionModel: optionModel
                };
                emailHelpers.sendEmail(emailObj, 'cart/addToCartEmail', prodObj);
                prodsObj.push(prodObj);


            } else {
                // product set
                pidsObj = JSON.parse(req.form.pidsObj);
                result = {
                    error: false,
                    message: Resource.msg('text.alert.addedtobasket', 'product', null)
                };

                pidsObj.forEach(function (PIDObj) {
                    quantity = parseInt(PIDObj.qty, 10);
                    var pidOptions = PIDObj.options ? JSON.parse(PIDObj.options) : {};
                    var PIDObjResult = cartHelper.addProductToCart(
                        currentBasket,
                        PIDObj.pid,
                        quantity,
                        childProducts,
                        pidOptions
                    );
                    // email elements
                    var product = ProductMgr.getProduct(PIDObj.pid);
                    var optionModel = productHelper.getCurrentOptionModel(product.optionModel, pidOptions);
                    var prodObj = {
                        productId: PIDObj.pid,
                        product: product,
                        productName: product.getName(),
                        productUrl: product.getPageURL(),
                        imageUrl: product.getImage('large', 0).getHttpImageURL({scaleWidth: 300, format: 'jpg'}),
                        imageAlt: product.getImage('large', 0).getAlt(),
                        productPrice: product.getPriceModel().getPrice().decimalValue,
                        quantity: quantity,
                        productDescription: product.getShortDescription(),
                        childProducts: childProducts,
                        optionModel: optionModel
                    };
                    emailHelpers.sendEmail(emailObj, 'cart/addToCartEmail', prodObj);
                    prodsObj.push(prodObj);

                    if (PIDObjResult.error) {
                        result.error = PIDObjResult.error;
                        result.message = PIDObjResult.message;
                    }
                });
            }
            if (!result.error) {
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                basketCalculationHelpers.calculateTotals(currentBasket);
            }
        });
    }

    var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);
    var cartModel = new CartModel(currentBasket);

    var urlObject = {
        url: URLUtils.url('Cart-ChooseBonusProducts').toString(),
        configureProductstUrl: URLUtils.url('Product-ShowBonusProducts').toString(),
        addToCartUrl: URLUtils.url('Cart-AddBonusProducts').toString()
    };

    var newBonusDiscountLineItem =
        cartHelper.getNewBonusDiscountLineItem(
            currentBasket,
            previousBonusDiscountLineItems,
            urlObject,
            result.uuid
        );
    if (newBonusDiscountLineItem) {
        var allLineItems = currentBasket.allProductLineItems;
        var collections = require('*/cartridge/scripts/util/collections');
        collections.forEach(allLineItems, function (pli) {
            if (pli.UUID === result.uuid) {
                Transaction.wrap(function () {
                    pli.custom.bonusProductLineItemUUID = 'bonus'; // eslint-disable-line no-param-reassign
                    pli.custom.preOrderUUID = pli.UUID; // eslint-disable-line no-param-reassign
                });
            }
        });
    }

    var reportingURL = cartHelper.getReportingUrlAddToCart(currentBasket, result.error);

    res.json({
        reportingURL: reportingURL,
        quantityTotal: quantityTotal,
        message: result.message,
        cart: cartModel,
        newBonusDiscountLineItem: newBonusDiscountLineItem || {},
        error: result.error,
        pliUUID: result.uuid,
        minicartCountOfItems: Resource.msgf('minicart.count', 'common', null, quantityTotal)
    });

    next();
});


module.exports = server.exports();
