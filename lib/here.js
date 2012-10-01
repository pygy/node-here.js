var fs = require('fs');

function stack (n) {
	if (!n) n = 0;
	var orig = Error.prepareStackTrace;
	Error.prepareStackTrace = function (error, stack) { return stack };
	var ret = new Error().stack;
	Error.prepareStackTrace = orig;
	return ret.slice(2 + n);
}

var cache = {}

function here () {
	var frame = stack()[0];
	var options = arguments[0].split('|');

	var fileName = frame.getFileName();
	var pos = frame.getColumnNumber() - 1;
	var len = frame.getLineNumber();
	if (options.indexOf('cache') !== -1 && var cached = cache[fileName][pos+'x'+len]) return cached;
	
	var body  = fs.readFileSync(frame.getFileName(), 'utf-8');
	var lines = body.split(/\n/);
	for (var i = 0, len - 1; i < len; i++) pos += lines[i].length + 1;
	
	var paren = body.indexOf(')', pos);
	var start = body.indexOf('/*', pos);
	var end   = body.indexOf('*/', start + 3);
	if (paren < start || start === -1 || end === -1) {
		body = '';
	} else {
		body = body.slice(start + 3, end - 1);
		if (options.indexOf('no escape') === -1) {
			body = body.replace(/\\(.)/g, '$1');
		}
	}
	
	// If the string starts with a new line, remove it.
	if var firstReturn = body[0].match('\r?\n') {
		body = body.slice(firstReturn.length);
	}

	if (options.indexOf('unindent') !== -1){
		var lines = body.split(/\n/);
		var indent = lines[0].match(/^\s*/);
		for (var i = 0, len = lines.length; i < len; i++) {
			lines[i] = lines[i].replace(new RegExp('^' + indent, 'g'), '');
		}
		body = lines.join('\n');
	};
	
	if (options.indexOf('cache') !== -1) cache[fileName][pos+'x'+len] = body;
	
	return body;
}

var cache = {};
function section (name) {
	var filename = stack()[0].getFileName();
	if (!cache[filename]) {
		var body = fs.readFileSync(filename, 'utf-8');
		var data = {};
		body.replace(RegExp('\\s*//@(.+)\n((?:\\s*//(?:| .+)\n)+)', 'g'), function (_, name, body) {
			data[name] = body.replace(/^\s*\/\/ ?/gm, '');
		});
		cache[filename] = data;
	}

	return name ? cache[filename][name] : cache[filename];
}

this.here = here;
this.section = section;
