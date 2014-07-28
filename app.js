var express = require("express");
var spawn = require('child_process').spawn;
var fs = require("fs");
var crypto = require('crypto');
var http = require("http");
var config = require("./config");

var app = express();


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
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};


app.get("/", function(req, res){
  var from = req.query.from;
  var inputFormat = req.query.inputformat;
  var outputFormat = req.query.outputformat;
  if (from && inputFormat && outputFormat){
    var destFilename = crypto.createHash('md5').update(from + String(new Date().getTime())).digest('hex')+"."+ inputFormat;
    var saveFilename = crypto.createHash('md5').update(destFile + String(new Date().getTime())).digest('hex')+"."+ outputFormat;
    var destFile = config.dataPath + destFilename;
    var saveFile = config.dataPath + saveFilename;

    download(from, destFile, function(){
      var param = [];
      if (req.query.param){
        param = req.query.param.split(",");
      }
      param.splice(0, 0, "-i", destFile);
      param.push(saveFile);
      var ffmpeg = spawn("ffmpeg", param);
      ffmpeg.on('close', function(code){
        if (code == 0){
          console.log('Processing finished !');
          resp = {input: config.httpPath+destFilename, output: config.httpPath+saveFilename};
          res.send(JSON.stringify(resp));
        }
        else{
          console.log('An error occurred');
          fs.unlink(destFile);
          fs.unlink(saveFile);
          res.send("ffmpeg failed");
        }
      });
    });
  }
  else{
    res.status(401).end();
  }
});

app.enable('trust proxy')
app.listen(3000);
