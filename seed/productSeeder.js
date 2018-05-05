var Product = require('../models/product');

var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/shopping');

var products = [
	new Product({
		imagePath:'/images/yamaha-boat-ar210-2018-black-side-profile.png',
		title : '1 Yamaha Boat AR210 2018',
		boatType:'Yatch',
		brand:'Yamaha',
		year:'2018',
		description:'This is a nice boat with low usage and available for sale as soon as possible.',
		price:30000
	}),
	new Product({
		imagePath:'/images/yamaha-boat-ar210-2018-black-side-profile.png',
		title : '2 Yamaha Boat AR210 2018',
		boatType:'Yatch',
		brand:'Yamaha',
		year:'2018',
		description:'This is a nice boat with low usage and available for sale as soon as possible.',
		price:30000
	}),
	new Product({
		imagePath:'/images/yamaha-boat-ar210-2018-black-side-profile.png',
		title : '3 Yamaha Boat AR210 2018',
		boatType:'Yatch',
		brand:'Yamaha',
		year:'2018',
		description:'This is a nice boat with low usage and available for sale as soon as possible.',
		price:30000
	}),
	new Product({
		imagePath:'/images/yamaha-boat-ar210-2018-black-side-profile.png',
		title : '4 Yamaha Boat AR210 2018',
		boatType:'Yatch',
		brand:'Yamaha',
		year:'2018',
		description:'This is a nice boat with low usage and available for sale as soon as possible.',
		price:30000
	}),
	new Product({
		imagePath:'/images/yamaha-boat-ar210-2018-black-side-profile.png',
		title : '5 Yamaha Boat AR210 2018',
		boatType:'Yatch',
		brand:'Yamaha',
		year:'2018',
		description:'This is a nice boat with low usage and available for sale as soon as possible.',
		price:30000
	})

];

var done = 0;

for(var i = 0; i < products.length; i++){
	products[i].save(function(err, result) {
		done++;
		if(done === products.length){
			exit();
		}
	});
}
 function exit() {
 	mongoose.disconnect();
 }

