/**
 * Created by wangyc on 15-2-23.
 */
var express = require('express');
var router = express.Router();
var Thread = require('./thread');
var async = require("async");
var samples = require("../models/samples");
var user = require("../models/user");
router.get('/', function (req, res, next) {

    // check if login
    var token = res.session.user;
    if (token === undefined) {
        res.redirect("/index");
        return;
    }

    console.log(["session.user",  res.session.username]);
    var _username = res.session.username;
    var _keyword = req.query.kw;
    // default select
    if (_keyword == null) {
        _keyword = 'iPhone6';
    }
    var _labelCount = null;
    var _validateCount = null;

    async.waterfall([

        function(callback) {

            user.getUser(_username, function(status, msg){

                if(status != 0) callback(1, "error");
                else {
                    console.log(msg);
                    callback(null, {
                        "labelCount": msg["labelCount"],
                        "validateCount": msg["validateCount"]
                    });
                }
            });
        }
    ], function (err, result){
        samples.getSamplesByLabels(_keyword, _username, function(status, msg){

            if(status != 0) {
                res.send("发生错误！");
            } else {
                console.log(["labelCount: ", result['labelCount']]);
                res.render('label', {
                    title: '微博标注平台',
                    keyword: _keyword,
                    isSuper: res.session.isSuper,
                    username: _username,
                    rows: msg,
                    labelCount: result["labelCount"],
                    validateCount: result["validateCount"]
                });
            }
        });

    });
});


router.post('/', function (req, res) {
  var _id = req.body.id;
  var _keyword = req.body.keyword;
  var _trash = req.body.trash;
  if (_trash == 0) {
    var _username = req.body.username;
    var _labels = req.body.labels;
    var thread = new Thread(_id, _keyword, _username, _labels);
    thread.save(function (status, msg) {
      res.json({'status': status, 'msg': msg});
    });
  } else {
    var thread = new Thread(_id, _keyword);
    thread.trash(function (status, msg) {
      res.json({'status': status, 'msg': msg});
    });
  }
});

module.exports = router;
