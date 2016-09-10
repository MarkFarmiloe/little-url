'use strict';

var express = require('express');
var fs = require('fs');
var path = require('path');

var app = express();

app.set('port', (process.env.PORT || 8080));

app.get('/', function (req, res) {
  fs.createReadStream(path.join(__dirname, 'public', 'index.html')).pipe(res);
});

app.get('/:data', function (req, res) {
  var dateData = req.params.data;
  var obj = { unix: null, natural: null };
  var dt = new Date(dateData);
  if (isNaN(dt)) {
    dt = new Date(Number(dateData) * 1000);
  }
  if (isNaN(dt)){
    res.end(JSON.stringify(obj));
  } else {
    obj = { unix: dt.getTime() / 1000, natural: dt.toDateString() };
    res.end(JSON.stringify(obj));
  }
});

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});
