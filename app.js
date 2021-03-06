var express = require('express'),
    spawn = require('child_process').spawn,
    fs = require('fs'),
    crypto = require('crypto'),
    http = require('http'),
    path = require('path'),
    config = require('./config');

var app = express();
var dataPath = config.dataPath || (__dirname + '/data');
var httpPath = config.httpPath || '/data';


var download = function(url, dest, cb) {
  console.log("start downloading");
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      console.log("finish downloading");
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest, function(){}); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};


app.get("/", function(req, res){
  var from = req.query.from;
  var inputFormat = req.query.inputformat;
  var outputFormat = req.query.outputformat;
  if (from && inputFormat && outputFormat){

    var destFilename = crypto.createHash('md5').update(from + String(new Date().getTime())).digest('hex')+'.'+ inputFormat;
    var saveFilename = crypto.createHash('md5').update(destFilename + String(new Date().getTime())).digest('hex')+'.'+ outputFormat;
    var destFile = path.join(dataPath, destFilename);
    var saveFile = path.join(dataPath, saveFilename);

    download(from, destFile, function(){
      var param = [];
      if (req.query.param){
        param = req.query.param.split(',');
      }
      param.splice(0, 0, '-i', destFile);
      param.push(saveFile);
      var ffmpeg = spawn('ffmpeg', param);
      ffmpeg.on('close', function(code){
        if (code == 0){
          console.log('Processing finished');
          res.send({result:'success', input: path.join(httpPath, destFilename), output: path.join(httpPath, saveFilename)});
        }
        else{
          console.log('An error occurred');

          // remove unnecessary files in async
          fs.unlink(destFile, function(){});
          fs.unlink(saveFile, function(){});

          res.send({result:'failed'});
        }
      });
    });
  }
  else{
    res.status(401).end();
  }
});

app.enable('trust proxy');
if (config.serveStatic){
  // if you want to use express to serve files, instead using a reverse proxy such as Nginx
  app.use(httpPath, express.static(dataPath));
}
app.listen(config.port || 3000);
console.log('server started');
