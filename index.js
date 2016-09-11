'use strict';

var express = require('express');
var mongo = require('mongodb').MongoClient;
//var fs = require('fs');
var path = require('path');

var app = express();

app.set('port', (process.env.PORT || 8080));

var dbUrl = 'mongodb://localhost:27017/fcc';

app.use(express.static(path.join(__dirname, 'public')));

//app.get('/', function (req, res) {
//  fs.createReadStream(path.join(__dirname, 'public', 'index.html')).pipe(res);
//});

function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locater
  if(!pattern.test(str)) {
    //alert("Please enter a valid URL.");
    return false;
  } else {
    return true;
  }
}

app.get('/new/*', function (req, res) {
    var longUrl = req.params[0],
        shortUrl = null,
        link = null;
    if (!validURL(longUrl)) {
        res.end(JSON.stringify({ error : 'Wrong url format, make sure you have a valid protocol and real site.'}));
    }
    mongo.connect(dbUrl, function (err, db) {
        if (err) {
            res.end('Link database currently unavailable. Please try again later.');
        }
        var coll = db.collection('urls');
        coll.find({ 'original_url': longUrl }, { original_url: 1, short_url: 1, _id: 0 }).toArray(function(err, links) {
            if (err) {
                db.close();
                res.end('Internal database error. Please try again later.');
            }
            if (links.length > 0) {
                link = links[0];
                console.log('Found: ' + JSON.stringify(link));
                db.close();
                res.end(JSON.stringify(link));
            }
            coll.aggregate([
                { $match: {} },
                { $group: { _id: 'max', max: { $max: '$short_url'}}}
                ]).toArray(function(err, results) {
                    if (err) {
                        db.close();
                        res.end('Internal database error. Please try again later.');
                    }
                    if (results.length > 0) {
                        console.log(results[0]);
                        shortUrl = Number(results[0].max) + 1;
                    } else {
                        shortUrl = 1;
                    }
                    link = { original_url: longUrl, short_url: shortUrl };
                    db.collection('urls').insert({ original_url: longUrl, short_url: shortUrl });
                    console.log('Added: ' + JSON.stringify(link));
                    db.close();
                    res.end(JSON.stringify(link));
            });
        });
    });
});

app.get('/:shortUrl', function (req, res) {
    var shortUrl = Number(req.params.shortUrl);
    mongo.connect(dbUrl, function (err, db) {
        if (err) {
            res.end('Link database currently unavailable. Please try again later.');
        }
        var coll = db.collection('urls');
        coll.find({ 'short_url': shortUrl }, { original_url: 1, short_url: 1, _id: 0 }).toArray(function(err, links) {
            if (err) {
                db.close();
                res.end('Internal database error. Please try again later.');
            }
            if (links.length > 0) {
                var link = links[0];
                console.log('Found: ' + JSON.stringify(link));
                db.close();
                res.redirect(link.original_url);
            }
            db.close();
            res.end('Short link not found.');
        });
    });
});

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});
