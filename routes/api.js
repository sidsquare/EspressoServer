var express = require('express');
var router = express.Router();
var mysql = require('mysql');

require('dotenv').config()

var con = mysql.createConnection({
	host     : process.env.RDS_HOSTNAME,
  user     : process.env.RDS_USERNAME,
  password : process.env.RDS_PASSWORD,
  port     : process.env.RDS_PORT
});

var fs = require('fs');

var AWS = require('aws-sdk');
AWS.config.update({
	"accessKeyId": process.env.ACCESS_KEY_ID,
	"secretAccessKey": process.env.SECRET_ACCESS_KEY,
	"region": process.env.REGION
})
var s3 = new AWS.S3();
	
con.connect(function(err){
	if(err){
		console.log("&"+process.env.RDS_PASSWORD+"&");
		console.log('mysql connection error '+err);
		throw(err);
	}
	else
		console.log('database connected');
});

router.post('/addRun',function(req,res,next){
	console.log('recieved a request');
	console.log(req.body);
	
	var file = 'runs/'+req.body.userID+'#'+req.body.activityID+'.json';

	var fileData = req.body;
	params={Bucket: process.env.S3_BASE_URL, Key: 'runs/'+req.body.userID+'#'+req.body.activityID+'.json'};
	s3.getObject(params, function(err, data) {
		if(err == null){
			console.log('file exists');
			res.send({'status':0});
		}else{
			correctElevationInternal(fileData, file, function(err, elevationList, largest, smallest){
				if(err){
					console.log(err);
					res.send({'status':1});
				}
				else{
					console.log('file written ');
					//for(var x=0;x< req.body.data.length;x++)
						//console.log(req.body.data[x].altitude);
					var queryString = "INSERT INTO espresso_database.running_details VALUES ('"+req.body.userID
						+"','"+req.body.activityID
						+"','"+req.body.start_time
						+"','"+req.body.end_time
						+"',"+req.body.duration
						+","+req.body.distance
						+","+req.body.max_altitude
						+","+req.body.min_altitude
						+","+req.body.altitude_dif
						+","+req.body.calories
						+","+req.body.is_weather_available
						+","+req.body.is_synced+")";

						if(req.body.is_weather_available==1){
							var queryString2 = "INSERT INTO espresso_database.weather_details VALUES ('"+req.body.userID
							+"','"+req.body.activityID
							+"','"+req.body.icon
							+"','"+req.body.summary
							+"',"+req.body.temperature
							+","+req.body.humidity
							+","+req.body.wind
							+","+req.body.precipitation+")";

							con.query( queryString2, function(err, result){
								if(err)
									console.log(err);
							});
						}
						
					console.log(queryString);

					con.query(queryString, function(err, result){
						if(err)
							console.log(err);
					});
					res.send("{'status':0,'max':"+largest+",'min':"+smallest+",'activityID':"+req.body.activityID+",'elevationCorrection':["+elevationList+"]}");
				}
				//console.log('result '+ elevationList);
			});
		}
	});
});

router.post('/getRunList', function(req,res,next){
	console.log('recieved a request for run list');
	var queryString = "SELECT activityID FROM espresso_database.running_details WHERE userID = '"+req.body.userID+"'";
	console.log(queryString);
	con.query(queryString, function(err,rows,fields){
		if(err){
			console.log(err);
			res.send("{'activityID':[]}");
		}
		else{
			var temp=[];
			for(var x=0;x<rows.length;x++)
				temp.push(rows[x].activityID);
			console.log("{'activityID':["+temp+"]}");
			res.send("{'activityID':["+temp+"]}");
		}
	});
});


router.post('/getRun', function(req,res,next){
	console.log('recieved a request for run id '+req.body.activityID);
	var queryString = "SELECT * FROM espresso_database.running_details WHERE userID = '"+req.body.userID+"' && activityID = '"+req.body.activityID+"'";

	con.query(queryString, function(err,rows,fields){
		if(err){
			console.log(err);
			res.send("{}");
		}
		else{
			if(rows[0].is_weather_available==1){
				var queryString2 = "SELECT * FROM espresso_database.weather_details WHERE userID = '"+req.body.userID+"' && activityID = '"+req.body.activityID+"'";
				con.query(queryString2, function(err,rows2,fields2){
					if(err){
						console.log(err);
						res.send("{}");
					}else{
						params={Bucket: process.env.S3_BASE_URL, Key: 'runs/'+req.body.userID+'#'+req.body.activityID+'.json'};
						s3.getObject(params, function(err, data) {
							if(err)
								console.log(err);
							console.log(data.Body.toString('utf-8'));
							res.send(data.Body.toString('utf-8'));
						});
					}
				})
			}else{
				//var file = DIR+req.body.userID+'#'+req.body.activityID+'.json';
				params={Bucket: process.env.S3_BASE_URL, Key: 'runs/'+req.body.userID+'#'+req.body.activityID+'.json'};
				s3.getObject(params, function(err, data) {
					if(err)
						console.log(err);
					console.log(data.Body.toString('utf-8'));
					res.send(data.Body.toString('utf-8'));
				});
			}
		}
	});
});

router.post('/deleteRun', function(req, res){
	var a = 0;
	console.log(req.body);
	var queryString = "DELETE FROM espresso_database.running_details WHERE activityID = '"+req.body.activityID+"' AND userID = '"+req.body.userID+"';";
	console.log(queryString);
	con.query(queryString, function(err, result){
		if(err){
			res.send("{'status':'1'}");
			console.log(err);
		}
		else{
			a++;
			if(a == 2)
				res.send("{'status':'0'}");
			console.log('deleted from running_details');
		}
	});
	var queryString = "DELETE FROM espresso_database.weather_details WHERE activityID = '"+req.body.activityID+"' AND userID = '"+req.body.userID+"';";
	con.query(queryString, function(err, result){
		if(err){
			res.send("{'status':'1'}");
			console.log(err);
		}
		else{
			a++;
			if(a == 2)
				res.send("{'status':'0'}");
			console.log('deleted from weather_details');
		}
	});
});

router.post('/addRoute', function(req, res){
	console.log('recieved a request to add route');
	//console.log(req.body);
	
	var file = 'routes/'+req.body.userID+'#'+req.body.routeID+'.json';

	var fileData = req.body;
	params={Bucket: process.env.S3_BASE_URL
		, Key: 'routes/'+req.body.userID+'#'+req.body.routeID+'.json'};
	s3.getObject(params, function(err, data) {
		if(err == null){
			console.log('file exists ');
		}else{
			params={Bucket: process.env.S3_BASE_URL
				,  Key: 'routes/'+req.body.userID+'#'+req.body.routeID+'.json'
				, Body: JSON.stringify(req.body)};
			s3.putObject(params, function(err, data) {
				if(err)
					console.log(err);
				else
					console.log('file written ');
			});
					//for(var x=0;x< req.body.data.length;x++)
						//console.log(req.body.data[x].altitude);
		}
	});

	var queryString = "INSERT INTO espresso_database.route_details VALUES ('"+req.body.userID
		+"','"+req.body.routeID
		+"','"+req.body.name
		+"','"+req.body.date_created
		+"',"+req.body.distance
		+","+req.body.avg_time
		+","+req.body.avg_speed
		+","+req.body.avg_calories
		+","+req.body.max_altitude
		+","+req.body.min_altitude
		+","+req.body.altitude_dif
		+",'"+req.body.date_last_completed
		+"',"+req.body.times_completed
		+","+req.body.is_synced
		+")";		
					
//	console.log(queryString);

	con.query(queryString, function(err, result){
		if(err){
			console.log(err);
			var queryString2 = "UPDATE espresso_database.route_details"
				+" SET"
				+" distance = "+req.body.distance
				+", avg_time = "+req.body.avg_time
				+", avg_speed = "+req.body.avg_speed
				+", avg_calories = "+req.body.avg_calories
				+", max_altitude = "+req.body.max_altitude
				+", min_altitude = "+req.body.min_altitude
				+", altitude_dif = "+req.body.altitude_dif
				+", date_last_completed = '"+req.body.date_last_completed
				+"', times_completed = "+req.body.times_completed
				+", is_synced = "+req.body.is_synced
				+" WHERE routeID = "+ req.body.routeID + " AND userID = "+ req.body.userID;

			//console.log(queryString2);

			con.query(queryString2, function(err, result2){
				if(err){
					console.log(err);
					res.send({'status': 1});
				}else{
					console.log('route updated');
					res.send({'status': 0,'routeID': req.body.routeID});
				}
			});
		}else{
			res.send({'status': 0,'routeID': req.body.routeID});
		}
	});
});

router.post('/getRouteList', function(req,res,next){
	console.log('recieved a request for route list');
	var queryString = "SELECT routeID FROM espresso_database.route_details WHERE userID = '"+req.body.userID+"'";
	console.log(queryString);
	con.query(queryString, function(err,rows,fields){
		if(err){
			console.log(err);
			res.send("{'routeID':[]}");
		}
		else{
			var temp=[];
			for(var x=0;x<rows.length;x++)
				temp.push(rows[x].routeID);
			console.log("{'routeID':["+temp+"]}");
			res.send("{'routeID':["+temp+"]}");
		}
	});
});

router.post('/getRoute', function(req,res,next){
	console.log('recieved a request for route id '+req.body.routeID);
	var queryString = "SELECT * FROM espresso_database.route_details WHERE userID = '"+req.body.userID+"' && routeID = '"+req.body.routeID+"'";

	con.query(queryString, function(err,rows,fields){
		if(err){
			console.log(err);
			res.send("{}");
		}
		else{
				//var file = DIR+req.body.userID+'#'+req.body.routeID+'.json';
			params={Bucket: process.env.S3_BASE_URL, Key: 'routes/'+req.body.userID+'#'+req.body.routeID+'.json'};
			s3.getObject(params, function(err, data) {
				if(err)
					console.log(err);
				//console.log(data.Body.toString('utf-8'));
				res.send(data.Body.toString('utf-8'));
			});
		}
	});
});

router.post('/deleteRoute', function(req, res){
	var queryString = "DELETE FROM espresso_database.route_details WHERE routeID = '"+req.body.routeID+"' AND userID = '"+req.body.userID+"';";
	console.log(queryString);
	con.query(queryString, function(err, result){
		if(err){
			res.send("{'status':'1'}");
			console.log(err);
		}
		else{
			res.send("{'status':'0'}");
			console.log('deleted from route_details');
		}
	});
});


////
router.post('/addPlan', function(req, res){
	console.log('recieved a request to add plan');
	//console.log(req.body);
	
	var file = 'plans/'+req.body.userID+'#'+req.body.planID+'.json';

	var fileData = req.body;
	params={Bucket: process.env.S3_BASE_URL
		, Key: 'plans/'+req.body.userID+'#'+req.body.planID+'.json'};
	s3.getObject(params, function(err, data) {
		if(err == null){
			console.log('file exists ');
		}else{
			params={Bucket: process.env.S3_BASE_URL
				,  Key: 'plans/'+req.body.userID+'#'+req.body.planID+'.json'
				, Body: JSON.stringify(req.body)};
			s3.putObject(params, function(err, data) {
				if(err)
					console.log(err);
				else
					console.log('file written ');
			});
					//for(var x=0;x< req.body.data.length;x++)
						//console.log(req.body.data[x].altitude);
		}
	});

	var queryString = "INSERT INTO espresso_database.plan_details VALUES ('"+req.body.userID
		+"','"+req.body.planID
		+"','"+req.body.name
		+"','"+req.body.date_created
		+"',"+req.body.avg_distance
		+","+req.body.avg_time
		+","+req.body.avg_speed
		+","+req.body.avg_calories
		+","+req.body.max_altitude
		+","+req.body.min_altitude
		+","+req.body.altitude_dif
		+",'"+req.body.date_last_completed
		+"',"+req.body.times_completed
		+","+req.body.is_synced
		+")";		
					
	//console.log(queryString);

	con.query(queryString, function(err, result){
		if(err){
			console.log(err);
			var queryString2 = "UPDATE espresso_database.plan_details"
				+" SET"
				+" avg_distance = "+req.body.avg_distance
				+", avg_time = "+req.body.avg_time
				+", avg_speed = "+req.body.avg_speed
				+", avg_calories = "+req.body.avg_calories
				+", max_altitude = "+req.body.max_altitude
				+", min_altitude = "+req.body.min_altitude
				+", altitude_dif = "+req.body.altitude_dif
				+", date_last_completed = '"+req.body.date_last_completed
				+"', times_completed = "+req.body.times_completed
				+", is_synced = "+req.body.is_synced
				+" WHERE planID = "+ req.body.planID + " AND userID = "+ req.body.userID;

			//console.log(queryString2);

			con.query(queryString2, function(err, result2){
				if(err){
					console.log(err);
					res.send({'status': 1});
				}else{
					console.log('plan updated');
					res.send({'status': 0,'planID': req.body.planID});
				}
			});
		}else{
			res.send({'status': 0,'planID': req.body.planID});
		}
	});
});

router.post('/getPlanList', function(req,res,next){
	console.log('recieved a request for plan list');
	var queryString = "SELECT planID FROM espresso_database.plan_details WHERE userID = '"+req.body.userID+"'";
	console.log(queryString);
	con.query(queryString, function(err,rows,fields){
		if(err){
			console.log(err);
			res.send("{'planID':[]}");
		}
		else{
			var temp=[];
			for(var x=0;x<rows.length;x++)
				temp.push(rows[x].planID);
			console.log("{'planID':["+temp+"]}");
			res.send("{'planID':["+temp+"]}");
		}
	});
});

router.post('/getPlan', function(req,res,next){
	console.log('recieved a request for plan id '+req.body.planID);
	var queryString = "SELECT * FROM espresso_database.plan_details WHERE userID = '"+req.body.userID+"' && planID = '"+req.body.planID+"'";

	con.query(queryString, function(err,rows,fields){
		if(err){
			console.log(err);
			res.send("{}");
		}
		else{
				//var file = DIR+req.body.userID+'#'+req.body.planID+'.json';
			params={Bucket: process.env.S3_BASE_URL, Key: 'plans/'+req.body.userID+'#'+req.body.planID+'.json'};
			s3.getObject(params, function(err, data) {
				if(err)
					console.log(err);
				//console.log(data.Body.toString('utf-8'));
				res.send(data.Body.toString('utf-8'));
			});
		}
	});
});

router.post('/deletePlan', function(req, res){
	var queryString = "DELETE FROM espresso_database.plan_details WHERE planID = '"+req.body.planID+"' AND userID = '"+req.body.userID+"';";
	console.log(queryString);
	con.query(queryString, function(err, result){
		if(err){
			res.send("{'status':'1'}");
			console.log(err);
		}
		else{
			res.send("{'status':'0'}");
			console.log('deleted from plan_details');
		}
	});
});


function correctElevationInternal(json, fileName, callback){
	var elevationList = [];
	if(json.data.length>0){
		var egm96 = require('egm96');
		largest=-egm96(json.data[0].lat,json.data[0].lon)+json.data[0].altitude;
		smallest=-egm96(json.data[0].lat,json.data[0].lon)+json.data[0].altitude;
		for(var x=0;x< json.data.length;x++){
			var tempData = json.data[x];
			var temp = -egm96(tempData.lat,tempData.lon)+tempData.altitude;
			if(temp>largest)
				largest=temp;
			if(smallest>temp)
				smallest=temp;
			json.data[x].altitude=temp;
			elevationList.push(temp);
		}
	}
	json.max_altitude = largest;
	json.min_altitude = smallest;
	params={Bucket: process.env.S3_BASE_URL, Key: fileName, Body: JSON.stringify(json)};
	s3.putObject(params, function(err, data) {
		if(err)
			console.log(err);
		callback(err, elevationList, largest, smallest);
	});
}

module.exports = router;