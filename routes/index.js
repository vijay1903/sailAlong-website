// Created by Vijay Vishwakarma May 2018

var express = require('express');
var router = express.Router();
var Cart = require('../models/cart');

var Product = require('../models/product');
var Order = require('../models/order');
var elasticsearch = require('elasticsearch');

//Redis part starts
// ----------------------------------------------------------
 var redis = require('redis');
 var redisclient = redis.createClient(6379, "sail-along-redis-001.pf****.0001.use2.cache.amazonaws.com");
 redisclient.auth('password', function (err) {
     if (err) throw err;
 });
 redisclient.on('connect', function() {
     console.log('Connected to Redis');
 });

/* For Redis : Start*/
 var mongooseRedisCache = require("mongoose-redis-cache");
 var mongoose = require('mongoose');
 var Schema = mongoose.Schema;
 var redisSchema = new Schema({


    imagePath: {type: String, required: true},
 	title: {type: String, required: true},
 	boatType: {type: String, required: true},
 	length: {type: String, required: true},
 	year: {type: Number, required: true},
 	description: {type: String, required: true},
 	price: {type: Number, required: true}
 });
module.exports = mongoose.model("RadisProduct",redisSchema);

// ---------------------------------------------------
// Redis part ends

// Elasticsearch part starts
//----------------------------------------------------
var client = new elasticsearch.Client({
    accessKeyId: 'AKIAJWPDLM4XAYOR****',
    secretAccessKey: 'yR9NKudjWtevikGWmlUe1hff1GcIeNvvfWyp****',
    service: 'es',
    region: 'US East (N. Virginia)',
    host: 'search-sail-along-es-domain-noyhmk246ctoihkpmei4tu****.us-east-1.es.amazonaws.com'
});
client.ping({
// ping usually has a 3000ms timeout
requestTimeout: 100000
}, function (error) {
if (error) {
    console.trace('elasticsearch cluster is down!');
} else {
    console.log('All is well');
}
});
//----------------------------------------------------
//elasticsearch part end





/* GET home page. */
router.get('/', function (req, res, next) {
    var successMsg = req.flash('success')[0];
    Product.find(function (err, docs) {
        var productChunks = [];
        var chunkSize = 3;
        for (var i = 0; i < docs.length; i += chunkSize) {
            productChunks.push(docs.slice(i, i + chunkSize));
        }
        res.render('shop/index', {title: 'Sail Along', products: productChunks, successMsg: successMsg, noMessages: !successMsg});
    });
});

// User profile section starts
router.get('/about', function (req, res, next) {
    Order.find({user: req.user}, function(err, orders) {
        if (err) {
            return res.write('Error!');
        }
        var cart;
        orders.forEach(function(order) {
            cart = new Cart(order.cart);
            order.items = cart.generateArray();
        });
        res.render('shop/about', { orders: orders });
    });
});
// User profile section 


router.get('/add-to-cart/:id',isLoggedIn, function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    Product.findById(productId, function(err, product) {
       if (err) {
           return res.redirect('/');
       }
        cart.add(product, product.id);
        req.session.cart = cart;
        console.log(req.session.cart);
        res.redirect('/');
    });
});

router.get('/decrease/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.decreaseByOne(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});

router.get('/increase/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.increaseByOne(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});


router.get('/remove/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.removeItem(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});


router.get('/shopping-cart', function(req, res, next) {
   if (!req.session.cart) {
       return res.render('shop/shopping-cart', {products: null});
   } 
    var cart = new Cart(req.session.cart);
    res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice});
});

router.get('/checkout', isLoggedIn, function(req, res, next) {
    if (!req.session.cart) {
        return res.redirect('/shopping-cart');
    }
    var cart = new Cart(req.session.cart);
    var errMsg = req.flash('error')[0];
    res.render('shop/checkout', {total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});
});

//additional section starts

router.get('/buy-now/:id', isLoggedIn, function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    Product.findById(productId, function(err, product) {
       if (err) {
           return res.redirect('/');
       }
        cart.add(product, product.id);
        req.session.cart = cart;
        console.log(req.session.cart);
        res.redirect('/shopping-cart');
    });
});

//additional section ends


router.post('/checkout', isLoggedIn, function(req, res, next) {
    if (!req.session.cart) {
        return res.redirect('/shopping-cart');
    }
    var cart = new Cart(req.session.cart);
    
    var stripe = require("stripe")(
        "sk_live_3Rl1MvlcnBH7zKg6UgP0cr1d"
    );
    // PAYMENT NOT WORKING
    stripe.createSource({
        type: 'ideal',
        amount: cart.totalPrice * 100,
        currency: "usd",
        source: req.body.stripeToken, // obtained with Stripe.js
        description: "Test Charge",
        owner: {
            name: 'Jenny Rosen',
          },
          redirect: {
            return_url: '/',
          },
    }, function(err, charge) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/checkout');
        }
        var order = new Order({
            user: req.user,
            cart: cart,
            address: req.body.address,
            name: req.body.name,
            paymentId: charge.id
        });
        order.save(function(err, result) {
            req.flash('success', 'Successfully bought product!');
            req.session.cart = null;
            res.redirect('/');
        });
    }); 
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
}

//Ealstic Search

/* ES Changes */
//^search?q=:query
router.get('/search',function(req,response,next){
    var pageNum = 1;
    var perPage = 6;
    // console.log("Hello there");
    var userQuery = req.query['query'];
    console.log("hello there,"+userQuery);
    var searchParams = {
        index: 'boat',
        from: (pageNum - 1) * perPage,
        size: perPage,
        type: 'default',
        body: {
            query: {
                multi_match: {
               //match: { "model": userQuery }
                    fields:  ["title","boatType","year","length","description"],
                    query:     userQuery,
                    fuzziness : "AUTO"
                }
            }
        }
};

// console.log("heelo 2222"+searchParams);
    client.search(searchParams, function (err, res) {
        if (err) {
            // handle error
            throw err;
        }
        //console.log(res);
       var results = res.hits.hits.map(function(i){
            return i['_source'];
        });
      //  console.log("****" +results);
        var productChunks = [];
        var chunkSize = 3;
        for(var i = 0;i<results.length;i+=chunkSize){
            productChunks.push(results.slice(i,i+chunkSize));
            //console.log(productChunks);
            //console.log("reached productchunks")
        }

        response.render('shop/index', {title: 'Sail Along',
            products: productChunks
        });
    });
});

router.get('/loadProduct', function (req, res) {
    console.log("Calling MongoDB to load product Details!");
    var productId = req.query._id;
    console.log(productId)
    Product.find({_id: productId}, function(err, product) {
        console.log("Connect to MongoDB");
        console.log("productName from MongoDb"+product);
        res.render('shop/product', {title: 'Shopping Cart', products: product});
    });
});
