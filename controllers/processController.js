module.exports = function (modules) {
    var leanKitController = require('../controllers/leanKitController')(modules);
    var salesForceController = require('../controllers/salesForceController')(modules);
    var rulesController = require('../controllers/rulesController')(modules);
    var localStore = modules.localStore;
    var async = require('async');
    var config = modules.config;

    var logMessages = modules.logMessages;
    var errLog = modules.errLog;
    var actLog = modules.actLog;

    return {
        /**
         * Main process.
         */run: function (data, callbackMain) {
            var sfUsers = [];
            async.series({
                login: function (callback) {
                    salesForceController.login(function (err, responce) {
                        callback(err, null);
                    });
                },

                users: function (callback) {
                    salesForceController.getAllUsers(function (err, responce) {
                        if (err) {
                            callback(err);
                        } else {
                            sfUsers = responce;
                            callback(null, "Checked " + sfUsers.length + " users. ");
                        }
                    });
                }
                ,
                opportunities: function (callback) {
                    var start_date = localStore.getOpportunityLastDate();
                    salesForceController.getAllOpportunities(start_date, function (err, responce) {
                        if (err) {
                            callback(err);
                        } else {
                            processData(sfUsers, responce, 'opportunities', function (err, result) {
                                callback(err, result);
                            });
                        }
                    });
                }
            }, function (err, results) {
                callbackMain(err, results);
            });
        }
    };


    /**
     * Process: Convert ServiceNow data and add it to LeanKit
     */
    function processData(sfUsers, values, key, callback) {
        var rules = config.get("rules");
        var defaultBoardId = config.get("leankit:boardId");
        var boards = [defaultBoardId];
        for (var n in rules) {
            if (rules[n].hasOwnProperty("boardId")) {
                boards.push(rules[n]['boardId']);
            }
        }
        leanKitController.getAvailableUsers(boards, function(err, availableUsers) {
            if (err) {
                callback(err);
            } else {
                rulesController.convertSnToLk(key, values, availableUsers, sfUsers, function (err, cards) {
                    if (err) {
                        callback(err);
                    } else {
                        processCards(cards, function (err, result) {
                            if (err) {
                                errLog.error(logMessages.errorProcessCards(err));
                                callback(err);
                            } else {
                                actLog.info(logMessages.successProcessCards(result));
                                callback(err, result);
                            }
                        });
                    }
                });
            }
        });
    }


    /**
     * Add/Update cards.
     */
    function processCards(cards, callback) {
        if (cards) {
            var addCardsTasks = [];
            for (n in cards) {
                if (cards[n].hasOwnProperty("addCard")) {
                    var card = cards[n]['addCard'];
                    var boardId = card['__boardId'];
                    var lainId = card['__laneId'];
                    var model = card['__model'];
                    delete card['__boardId'];
                    delete card['__laneId'];
                    delete card['__model'];
                    addCardsTasks.push(addCard.bind(addCard, boardId, card, lainId, model));
                } else if(cards[n].hasOwnProperty("updCard")) {
                    // Update card
                    var card = cards[n]['updCard'];
                    if (card) {
                        var boardId = card['__boardId'];
                        delete card['__boardId'];
                        var model = card['__model'];
                        delete card['__model'];
                        addCardsTasks.push(updCard.bind(updCard, boardId, card, model));
                    }
                }
            }

            async.series(addCardsTasks, function (err, results) {
                if (err) {
                    callback(err);
                } else {
                    var countAdd = 0;
                    var countUpd = 0;
                    for (n in results) {
                        var res = results[n];
                        if (res.hasOwnProperty("addCard")) {
                            countAdd++;
                        } else if (res.hasOwnProperty("updCard")) {
                            countUpd++;
                        }
                    }
                    callback(err, "Added " + countAdd + " cards. " + "Updated " + countUpd + " cards");
                }
            });
        } else {
            callback(null, "There is no cards");
        }
    }


    /**
     * Add new card to Leankit.
     */
    function addCard(boardId, card, lainId, model, callback) {
        leanKitController.addCard(boardId, lainId, card, function (err, response) {
            if (err) {
                model.setLastDate(model.get("LastModifiedDate"), modules);
                callback(err);
            } else {
                var result = {};
                result['addCard'] = response;
                callback(err, result);
            }
        });
    }

    /**
     * Update card in Leankit.
     */
    function updCard(boardId, card, model, callback) {
        leanKitController.updateCard(boardId, card, function (err, response) {
            if (err) {
                model.setLastDate(model.get("LastModifiedDate"), modules);
                callback(err);
            } else {
                var result = {};
                result['updCard'] = response;
                callback(err, result);
            }
        });

    }
};
