/**
 * Created by dongchao  on 15-03-23.
 */
var express = require('express');
// var User = require('./user');
var user = require("../models/user");
var router = express.Router();
var sha1 = require('node-sha1');

router.post('/', function(req, res){

    req.session.user = null;
    req.session.username = null;
    req.session.isSuper = null;

    res.json({"status": 0, "msg": "signout"});
});

module.exports = router;
