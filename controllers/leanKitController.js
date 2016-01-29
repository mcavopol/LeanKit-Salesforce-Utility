var LeanKitClient = require("../utils/leanKitWrapper");

module.exports = function (modules) {
    var accountName = modules.config.get("leankit:name");
    var email = modules.config.get("leankit:email");
    var password = modules.config.get("leankit:password");
    var client = LeanKitClient.createClient(accountName, email, password);

    var logMessages = modules.logMessages;
    var errLog = modules.errLog;
    var actLog = modules.actLog;
    var async = require('async');


    return {
        addCard: function (boardId, laneId, card, callback) {
            client.addCard(boardId, laneId, 1, card, function (err, response) {
                if (err) {
                    errLog.error(logMessages.errorAddCard(err, response));
                    callback(err);
                } else {
                    callback(err, response);
                }
            });
        },

        getCardByExternalId: function (boardId, externalId, callback) {
            client.getCardByExternalId(boardId, externalId, function (err, response) {
                if (err) {
                    errLog.error(logMessages.errorGetCardsByExternalId(externalId, err));
                    callback(err, response);
                } else {
                    callback(err, response);
                }
            });
        },

        updateCard: function (boardId, card, callback) {
            client.updateCard(boardId, card, function (err, response) {
                if (err) {
                    errLog.error(logMessages.errorUpdateCard(err, response));
                    callback(err);
                } else {
                    callback(err, response);
                }
            });
        },

        searchCardInAllBoards: function (options, callback) {
            client.searchCardInAllBoards(options, function (err, response) {
                if (err) {
                    errLog.error(logMessages.errorSearchCardInAllBoards(err, response));
                    callback(err);
                } else {
                    callback(err, response);
                }
            });
        },

        moveCard: function (cardId, destinationBoard, callback) {
            client.moveCardToBoard(cardId, destinationBoard, function (err, response) {
                callback(err, response);
            });
        },

        getAvailableUsers: function (boards, callback) {
            if (boards) {
                var asyncTasks = [];
                for (n in boards) {
                    asyncTasks.push(getAvailableUsersFromBoard.bind(getAvailableUsersFromBoard, boards[n]));
                }

                async.series(asyncTasks, function (err, response) {
                    if (err) {
                        callback(err);
                    } else {
                        var availableUsers = {};
                        if (response) {
                            for (n in response) {
                                if (response[n].hasOwnProperty("Id") && response[n].hasOwnProperty("BoardUsers")) {
                                    var boardId = response[n]["Id"];
                                    if (typeof(availableUsers[boardId]) == "undefined") {
                                        availableUsers[boardId] = [];
                                    }
                                    availableUsers[boardId] = response[n]["BoardUsers"];
                                }
                            }
                        }
                        callback(err, availableUsers);
                    }
                });
            } else {
                errLog.error(logMessages.boardsNotFound());
                callback(null);
            }
        }
    };

    function getAvailableUsersFromBoard(boardId, callback) {
        client.getBoard(boardId, function (err, response) {
            callback(err, response);
        });

    }
};
