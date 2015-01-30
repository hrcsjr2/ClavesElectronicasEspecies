var cv_json = require('..');

cv_json({
    // now supporting csv, xls, xlsx format
    input: __dirname + '/number_format.xls',
    output: null
  }, function(err, result) {
    if(err) {
      console.error(err);
    }else {
      console.log(result);
    }
  
  }
  );