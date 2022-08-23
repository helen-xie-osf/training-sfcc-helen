'use strict';

var server = require('server');
var controller = require('app_storefront_base/cartridge/controllers/Tile');


server.extend(controller);

server.append('Show', function(req,res,next){

    var discounting = 24;
    res.render('product/gridTile', {discounting: discounting});

    return next();
});


module.exports = server.exports();