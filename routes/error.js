var express = require('express');
var router = express.Router();

router.post('/',function(req,res,next){
	console.log('recieved error request '+req.body +req);
});

router.get('/',function(req,res,next){
	console.log('recieved error request '+req.body+req);
});

module.exports = router;

