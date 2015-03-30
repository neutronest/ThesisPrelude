/**
 * Created by neutronest on 15-3-13
 */

var async = require("async");
var Set = require("collections/set");
var MysqlClient = require("../models/mysql");
var conn = MysqlClient.createConnection();
var logger = require("../models/logger");

var samples = (function(){

    var that = this;


    /*
     * In the label page logic ===================================
     **/
    that.getSamplesByLabels = function(keyword, username, callback) {
        async.waterfall([
            function(callback) {

                MysqlClient.getCountofParentsByUser(keyword, username, function(status, msg){
                    if(status != 0) callback(null, "error");
                    else {

                        callback(null, msg['amount']);
                    }
                });
            },

            function(amount, callback) {
                if(amount === "error") {
                    callback(null, "error");
                }
                else {
                    // get random thread ids
                    var rdmLimit = Math.floor(Math.random() * amount);
                    MysqlClient.getSamplesIDRandomlyByUser(keyword, username, rdmLimit, function(status, rows){
                        if(status != 0) {
                          if (status === 2) {
                            callback(null, "no data");
                          } else {
                            callback(null, "error");
                          }
                        } else {
                            callback(null, rows[0]['id']);
                        }
                    });
                }
            },

            function(id, callback) {
                if(id === "no data") callback(null, "no data");
                else if(id === "error") callback(null, "error");
                else {
                    MysqlClient.getSamplesByIds(keyword, id, function(status, msg){
                        if(status != 0) callback(1, "error");
                        else callback(null, msg);
                    });
                }
            },

        ], function (err, result) {
            if (result === "error") callback(1, result);
            else if (result == "no data") callback(2, result);
            else callback(0, result);
        });
    };

    /*
     * In the overview page logic ===================================
     **/
    that.getCountofSamplesByLabeled = function(keyword, callback) {

        MysqlClient.getCountofSamplesByLabeled(keyword, function(status, msg){
            callback(status, msg);
        });
    };

    that.getCountofSamplesByConflict = function(keyword, callback) {

        MysqlClient.getCountofSamplesByConflict(keyword, function(status, msg){
            callback(status, msg);
        });
    };

    that.getCountofSamplesByTrash = function(keyword, callback) {

        MysqlClient.getCountofSamplesByTrash(keyword, function(status, msg){
            callback(status, msg);
        });
    };

    that.getCountofSamplesByUnlabeled = function(keyword, callback) {

        MysqlClient.getCountofSamplesByUnlabeled(keyword, function(status, msg){
            callback(status, msg);
        });
    };

    that.getStatsofSamples = function(keyword, callback) {

        var r = [];
        // get the result parallel
        async.parallel([

            function(callback) {
                that.getCountofSamplesByLabeled(keyword, function(status, msg){
                    logger.info("labeled");
                    callback(null, msg["amount"]);
                });
            },
            function(callback) {
                that.getCountofSamplesByConflict(keyword, function(status, msg){
                    logger.info("conflict");
                    callback(null, msg["amount"]);

                });
            },
            function(callback) {
                that.getCountofSamplesByTrash(keyword, function(status, msg){
                    logger.info("trash");
                    callback(null, msg["amount"]);
                });
            },
            function(callback) {
                that.getCountofSamplesByUnlabeled(keyword, function(status, msg){
                    logger.info("unlabeled");
                    callback(null, msg["amount"]);
                });
            }],function(err, results) {

                logger.info(results);
                callback(0, results);
            }
               );
    };

    /*
     * In the check page logic ===================================
     **/

    that.getCountofIdsByConflict = function(keyword, callback) {

        MysqlClient.getCountofIdsByConflict(keyword, function(status, row){

            if (status != 0) callback(1, "error");
            else callback(0, row['amount']);
        });
    }

    that.getSamplesByConflict = function(keyword, callback) {
        /*
         * This method is more complex.
         * First get all the conflict ids, that is group ids.
           keep the groupIds into a set to keep unique
           then for each group id, get their thread.
         */
        MysqlClient.getIdsByConflict(keyword, function(status, msg){

            if (status != 0) callback(1, "error");
            else {
                // the conflictIds are just group ids

                // transfer
                var conflictIds = [];
                for(var i=0; i<msg.length; i++) {
                    conflictIds.push(msg[i]['id']);
                }
                logger.info(conflictIds);
                // then change to the set
                var parentIds = new Set();
                for (var j=0; j<conflictIds.length; j++) {
                    parentIds.add(conflictIds[j]);
                }
                var parentIdsArray = Array.from(parentIds);
                logger.info(parentIdsArray);
                if (parentIdsArray.length === 0) {
                    callback(0, []);
                } else {
                    // get one parent Id every time
                    MysqlClient.getSamplesByIds(keyword, parentIdsArray[0], function(status, rows){
                        if (status != 0) callback(1, "error");
                        else callback(0, rows);
                    });
                }
            }
        });
    };

    that.checkConflict = function(keyword, id, username, _labels, callback) {
        var labels = JSON.parse(_labels);
        logger.info(["labels: ", labels]);
        for (var number in labels) {
            logger.info("number:", number);
            var valid = null;
            switch (labels[number]) {
            case 'positive':
                valid = 1;
                break;
            case 'neutral':
                valid = 0;
                break;
            case 'negative':
                valid = -1;
                break;
            default:
                valid = "NULL";
            }

            // upate database
            MysqlClient.updateValid(keyword, id, number, valid, function(status, msg){
                logger.info(["upateValid", status, msg]);
            });
        }
        callback(0, "success");
    };

    return {
        // stats
        getCountofSamplesByLabeled: getCountofSamplesByLabeled,
        getCountofSamplesByConflict: getCountofSamplesByConflict,
        getCountofSamplesByTrash: getCountofSamplesByTrash,
        getCountofSamplesByUnlabeld: getCountofSamplesByUnlabeled,
        // label
        getStatsofSamples: getStatsofSamples,
        getSamplesByLabels: getSamplesByLabels,
        // check
        getSamplesByConflict: getSamplesByConflict,
        getCountofIdsByConflict: getCountofIdsByConflict,
        checkConflict: checkConflict
    };
})();

module.exports = samples;
