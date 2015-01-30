var fs = require('fs');
var csv = require('csv-streamify');
var XLS = require('xlsjs');
var XLSX = require('xlsx');
var xml2js = require('xml2js');


function csv_json (file, opts, cb) {
	var fstream = fs.createReadStream(file);
	if(arguments.length === 2 && typeof arguments[1] === 'function') {
		// no opts
		cb = opts;
		opts = null;
	}

	return fstream.pipe(csv(opts, cb));
}

function xls_json (file, opts, cb) {
	if(arguments.length === 2 && typeof arguments[1] === 'function') {
		// no opts
		cb = opts;
		opts = null;
	}

	return cb(null, XLS.readFile(file, opts));
}

function xlsx_json (file, opts, cb) {
	if(arguments.length === 2 && typeof arguments[1] === 'function') {
		// no opts
		cb = opts;
		opts = null;
	}

	return cb(null, XLSX.readFile(file, opts));
}

function xml_json (file, opts, cb) {
	if(arguments.length === 2 && typeof arguments[1] === 'function') {
		// no opts
		cb = opts;
		opts = null;
	}
	
	var parser = new xml2js.Parser();
	fs.readFile(file, function(err, data) {
		if(err)
			cb(err);
		else
	    	parser.parseString(data, cb);
	});
}


module.exports = {
	csv: csv_json,
	xls: xls_json,
	xlsx: xlsx_json,
	xml: xml_json
};