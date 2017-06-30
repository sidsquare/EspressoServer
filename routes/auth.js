var express = require('express');
var router = express.Router();

var google = require('googleapis');
var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth;
var CLIENT_ID = '416659312336-ua27o7703vikdi3t0keahuvg8iqkk620.apps.googleusercontent.com'

var mysql = require('mysql');
var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "28julius9"
});

con.connect(function(err){
	if(err){
		console.log('mysql connection error '+err);
		throw(err);
	}
	else
		console.log('database connected');
});


router.post('/',function(req,res,next){
	console.log('recieved auth request '+req.body.tokenID);
	var client = new auth.OAuth2(CLIENT_ID, '', '');
	client.verifyIdToken(
			req.body.tokenID,
			CLIENT_ID,
			function(e, login) {
				if(login!=null){
					var payload = login.getPayload();
					var userID = payload['sub'];
					var email = payload['email'];
					var name = payload['name'];
					console.log('login successful...i guess ' + userID);
					console.log('email '+ email);
					console.log('Name '+ name);
					
					var query="SELECT * FROM espresso_database.user_details WHERE userID=\""+userID+"\";";
					console.log(query);
					con.query(query, function(err, rows, fields){
						if(err)
							console.log('mysql error '+ err);
						else{
							if(rows.length==0){
								var dateV = new Date();
								date = "'"+dateV.getFullYear()+"-"+dateV.getMonth()+"-"+dateV.getDay()
								+" "+dateV.getHours()+":"+dateV.getMinutes()+":"+dateV.getSeconds()+"'";
								var query2 = "INSERT INTO espresso_database.user_details VALUES (\""+name+"\",\""+email+"\",\""+userID+"\","+date+","+0+");";
								console.log(query2);
								con.query(query2, function(err, result){
									if(!err)
										res.send({'status':0,'userID':userID});
									else
										console.log('mysql error '+ err);
								});
							}else
								res.send({'status':0,'userID':userID});
						}
					});
				}else
					res.send({'status':1});
			});
});

module.exports = router;

