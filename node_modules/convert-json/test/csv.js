var cv2json = require('../');


var csv_trans = cv2json.csv('./sample/sample.csv', function(err, result) {
	if(err)
		console.error(err);
	else 
		console.log(result)
})