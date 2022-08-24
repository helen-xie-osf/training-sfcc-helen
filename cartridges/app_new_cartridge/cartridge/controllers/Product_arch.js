'use strict';

var server = require('server');
var controller = require('app_storefront_base/cartridge/controllers/Product');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.extend(controller);

server.append('Show-acrch',cache.applyPromotionSensitiveCache,function(req,res,next){

    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);

    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var ProductSearch = require('*/cartridge/models/search/productSearch');



    var apiProductSearch = new ProductSearchModel();
    apiProductSearch = searchHelper.setupSearch(apiProductSearch, req.querystring, req.httpParameterMap);
    apiProductSearch.search();

    if (!apiProductSearch.personalizedSort) {
        searchHelper.applyCache(res);
    }
    var productSearch = new ProductSearch(
        apiProductSearch,
        req.querystring,
        req.querystring.srule,
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot()
    );

    res.render('/search/productGrid', {
        productSearch: productSearch
    });

    next();

    // var URLUtils = require('dw/web/URLUtils');
    // var ProductFactory = require('*/cartridge/scripts/factories/product');
    // var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    // var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    // var productType = showProductPageHelperResult.product.productType;
    // var lookupProduct = showProductPageHelperResult.product;
    // var pid = lookupProduct.id;

    // var CatalogMgr = require('dw/catalog/CatalogMgr');
    // var ProductMgr = require('dw/catalog/ProductMgr');
    // var ProductSearchModel = require('dw/catalog/ProductSearchModel');

    // var category;
    // if (pid) {
    //     var targetProduct = ProductMgr.getProduct(pid);
    //     category = targetProduct.variant
    //         ? targetProduct.masterProduct.primaryCategory
    //         : targetProduct.primaryCategory;
    // }
    // var categoryName = category.displayName;



    // //var PagingModel = require('dw/web/PagingModel');

    // // var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    // // var apiProductSearch = new ProductSearchModel();
    // // apiProductSearch.setCategoryID(category.ID);
    // // apiProductSearch.search();


    // // var relevantCount = 0;
    // // var productSearchHit;
    // // var iter = apiProductSearch.getProductSearchHits();

    // // while (iter !== null && iter.hasNext()) {
    // //     //productSearchHit = iter.next();
    // //     relevantCount += 1;
    // // }


    // var context = {
    //     productSearch:,
    //     product:
    // }



    res.render(showProductPageHelperResult.template, {product: showProductPageHelperResult.product});
    next();
});


module.exports = server.exports();