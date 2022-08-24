'use strict';

var server = require('server');
var controller = require('app_storefront_base/cartridge/controllers/Product');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.extend(controller);

server.append('Show',cache.applyPromotionSensitiveCache,function(req,res,next){
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');

    var URLUtils = require('dw/web/URLUtils');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    // Find out current product info
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    var productType = showProductPageHelperResult.product.productType;
    var lookupProduct = showProductPageHelperResult.product;
    var pid = lookupProduct.id;

    var category;
    if (pid) {
        var targetProduct = ProductMgr.getProduct(pid);
        category = targetProduct.variant
            ? targetProduct.masterProduct.primaryCategory
            : targetProduct.primaryCategory;
    }
    var categoryId = category.ID;

    // Search similar products under same category

    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var ProductSearch = require('*/cartridge/models/search/productSearch');

    var apiProductSearch = new ProductSearchModel();
    var params = { cgid: categoryId, srule:'price-asc' };
    apiProductSearch = searchHelper.setupSearch(apiProductSearch, params);

    apiProductSearch.search();

    // Arrange sorting Rule manually here:
    // var sortingRule = 'price-asc';
    // var sortingRule = 'price-desc';
    // var sortingRule = 'name-asc';
    // var sortingRule = 'name-desc';
    // var sortingRule = 'toprated';
    // var sortingRule = 'newest';
    // var sortingRule = 'bestselling';
    // var sortingRule = 'mostviewed';
    // var sortingRule = 'mostreviewed';
    // var sortingRule = 'custom';

    var sortingRule = apiProductSearch.category.defaultSortingRule ? apiProductSearch.category.defaultSortingRule.ID : null;

    var productSearch = new ProductSearch(
        apiProductSearch,
        params,
        'price-asc',
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot()
    );


    var iter = apiProductSearch.getProductSearchHits();
    var products = [];
    var slotcount = 0;
   while (iter !== null && iter.hasNext() && (slotcount < 4)) {
        var productSearchHit = iter.next();
        var product = ProductFactory.get({ pid: productSearchHit.getProduct().ID, pview: 'tile', duuid: productSearchHit.getProduct().UUID });
        products.push(product);
        slotcount++;
    }

    // Todo: sort by price asc
    // var PriceHelper = require('*/cartridge/scripts/factories/price');
    // var productPrice = PriceHelper.getPrice(products[0]);



    // For debug:
    //var count = apiProductSearch.count;
    // var count = products.length;
    // var productID = products[count-1].id;
    // var productName = products[0].productName;
    // var productPrice = products[0].price.sales.formatted;

    res.render(showProductPageHelperResult.template, {products:products});
    return next();
});


module.exports = server.exports();