var express = require('express');
var router = express.Router();
var KalmanFilter = require('kalmanjs').default;

router.post('/', function(req, res, next) {
  console.log('recieved a request');
  console.log(req.body.list);
  var list = (req.body.list).split(",").map(Number);

  var list2=[101,101,102,102,102,103,103,104,105,105,106,107,107,107,106,106,106,104,104,103,103,103,102,102];

  for(var x=0;x<list2.length;x++){
  	printgraph(list2[x]);
  }
  console.log('****************-0')
  for (var x = 0; x < list.length; x++) {
    printgraph(list[x]);
  }

  console.log('******************3')
  printgraph(list[0]);
  for (var x = 1; x < list.length - 1; x++) {
    printgraph((list[x - 1] + list[x] + list[x + 1]) / 3);
  }
  printgraph(list[list.length - 1]);

  console.log('******************3 weighted')
  printgraph(list[0]);
  for (var x = 1; x < list.length - 1; x++) {
    printgraph((0.25 * list[x - 1]) + (0.5 * list[x]) + (0.25 * list[x + 1]));
  }
  printgraph(list[list.length - 1]);

  console.log('******************5')
  printgraph(list[0]);
  printgraph(list[1]);
  for (var x = 2; x < list.length - 2; x++) {
    printgraph((list[x - 2] + list[x - 1] + list[x] + list[x + 1] + list[x + 2]) / 5);
  }
  printgraph(list[list.length - 2]);
  printgraph(list[list.length - 1]);

  console.log('******************5 weighted')
  printgraph(list[0]);
  printgraph(list[1]);
  for (var x = 2; x < list.length - 2; x++) {
    printgraph((0.1*list[x - 2]) + (0.2*list[x - 1]) + (0.4*list[x]) + (0.2*list[x + 1]) + (0.1*list[x + 2]));
  }
  printgraph(list[list.length - 2]);
  printgraph(list[list.length - 1]);

  console.log('******************kalman');
  var kalmanFilter = new KalmanFilter(0.02,20,1);
  var list3=list.map(function(v){
  	return kalmanFilter.filter(v);
  });
  for(var x=0;x<list3.length;x++){
  	printgraph(list3[x]);
  }
});

function printgraph(y){
	var x='';
	y=y-100;
	y=y*10.0;
	for(var z=0;z<y;z++){
		x=x+'=';
	}
	console.log(x+'$');
}

module.exports = router;