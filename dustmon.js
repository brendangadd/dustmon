var argv = require('optimist').usage('Usage: node dustmon [options] watch_path')
		.options({
			d: {alias: 'outdir', describe: 'Output directory'},
			f: {alias: 'filename', describe: 'Output file name'}
		}).demand(1).argv,
	fs = require('fs'),
	path = require('path'),
	dust = require('dustjs-linkedin'),
	DUST_FILE_PATTERN = /\.dust\.html$/,
	watchPath = path.resolve(argv._[0]),
	outDir = argv.d ? path.resolve(argv.d) : watchPath,
	compiledFileName = argv.f || path.basename(watchPath) + '.js';

if (!fs.existsSync(watchPath)) {
	console.error('Watch path does does not exist');
	return;
}
if (!fs.statSync(watchPath).isDirectory()) {
	console.error('Watch path is not a folder');
	return;
}
if (!fs.existsSync(outDir)) {
	console.error('Output directory does does not exist');
	return;
}
if (!fs.statSync(outDir).isDirectory()) {
	console.error('Output directory is not a folder');
	return;
}

function compile() {
	var templates = getTemplates(watchPath),
		compiledScript = '';
	templates.forEach(function(template) {
		var content = fs.readFileSync(template, 'UTF-8'),
			templateName = path.basename(template).replace(DUST_FILE_PATTERN, '');
		try {
			compiledScript += dust.compile(content, templateName) + '\n';
		} catch (e) {
			console.error(e.message);
		}
	});
	fs.writeFile(outDir + path.sep + compiledFileName, compiledScript, 'UTF-8');
}

function getTemplates(dir) {
	var templates = [];
	fs.readdirSync(dir).forEach(function(fileName) {
		var filePath = dir + path.sep + fileName,
			fileStats = fs.statSync(filePath);
		if (fileStats.isDirectory()) {
			templates = templates.concat(getTemplates(filePath));
		} else if (fileStats.isFile() && DUST_FILE_PATTERN.test(fileName)) {
			templates.push(filePath);
		}
	});
	return templates;
}

fs.watch(watchPath, function(event, fileName) {
	if (!fileName || DUST_FILE_PATTERN.test(fileName)) {
		console.log('Change detected: ' + fileName);
		compile();
	}
});

console.log('Monitoring ' + watchPath + ' for changes');