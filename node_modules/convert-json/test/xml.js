var cv2json = require('../');


var csv_trans = cv2json.xml('./sample/sample.xml', function(err, result) {
	if(err)
		console.error(err);
	else 
		console.log(result)
})