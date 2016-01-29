var moment = require('moment');

module.exports = function (modules) {

    var leanKitController = require('./leanKitController')(modules);
    var config = modules.config;
    var async = require('async');
    var localStore = modules.localStore;

    var logMessages = modules.logMessages;
    var errLog = modules.errLog;
    var actLog = modules.actLog;

    return {
        /**
         * Convert SalesForce row to Leankit Card.
         */
        convertSnToLk: function (key, salesForceModelsArray, availableUsers, sfUsers, callback) {
            var asyncTasks = [];
            var model = null;
            for (var i in salesForceModelsArray) {
                model = salesForceModelsArray[i];
                // Check card. If exist update, if no add new one.
                asyncTasks.push(checkCard.bind(checkCard, model, availableUsers, sfUsers));
            }
            if (asyncTasks.length) {
                async.series(asyncTasks, function (err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        // if NO errors: save Last modelDate.
                        if (model) {
                            model.setLastDate(model.get("LastModifiedDate"), modules);
                        }
                        callback(err, results);
                    }
                });
            } else {
                callback(null);
            }
        }
    };

    /**
     *  Check if card there is in LeanKit.
     */
    function checkCard(model, availableUsers, sfUsers, callback) {
        var externalId = model.getExternalId();
        var rules = model.getRules(config);
        var boardId = rules.boardId;
        var postOptions = {
            "SearchTerm": externalId,
            "IncludeExternalId": true
        };

        leanKitController.searchCardInAllBoards(postOptions, function (err, response) {
            if (err) {
                callback(err);
            } else {
                if (response["Results"][0] && response["Results"][0].hasOwnProperty("BoardId") && response["Results"][0].hasOwnProperty("ExternalCardID")) {
                    if (response["Results"][0]["BoardId"] != rules.boardId && response["Results"][0]["ExternalCardID"] == externalId) {
                        boardId = response["Results"][0]["BoardId"];
                    }
                }

                leanKitController.getCardByExternalId(boardId, externalId, function (err, response) {
                    if (err) {
                        callback(err);
                    } else {
                        var result = {};
                        if (!response[0] || !response[0].hasOwnProperty("Id")) {
                            // Add new cards
                            result['addCard'] = attachNewCard(boardId, model, rules, availableUsers, sfUsers);
                        } else {
                            // Update cards
                            result['updCard'] = attachUpdatedCard(boardId, model, rules, availableUsers, sfUsers, response[0]);
                        }
                        callback(err, result);
                    }
                });
            }
        });
    }


    /**
     * Feature: update card.
     */
    function attachUpdatedCard(boardId, model, rules, availableUsers, sfUsers, originalCard) {
        var updFlag = false;
        var card = {};
        card['Id'] = originalCard['Id'];
        card['__model'] = model;

        if (originalCard['LaneId'] != rules.laneId) {
            updFlag = true;
        }
        card['Priority'] = 1;

        if (originalCard['TypeId'] != rules.cardTypeId) {
            updFlag = true;
        }
        card['TypeId'] = rules.cardTypeId;

        var model_title = model.getTitle();
        if (originalCard['Title'] != model_title) {
            updFlag = true;
        }
        card['Title'] = model_title;

        var model_description = model.getDescription();
        if (originalCard['Description'] != model_description) {
            updFlag = true;
        }
        card['Description'] = model_description;

        var model_start_date = model.getStartDate();
        if (originalCard["StartDate"] != model_start_date) {
            updFlag = true;
        }
        card["StartDate"] = model_start_date;

        var model_due_date = model.getDueDate();
        if (originalCard["DueDate"] != model_due_date) {
            updFlag = true;
        }
        card["DueDate"] = model_due_date;

        if (card['StartDate'] > card['DueDate']) {
            card['DueDate'] = "";
        }

        var model_assigned_users = model.getUsers(availableUsers, sfUsers, boardId);
        if (originalCard['AssignedUserIds'] != model_assigned_users) {
            updFlag = true;
        }
        card['AssignedUserIds'] = model_assigned_users;

        var model_size = model.getCardSize();
        if (originalCard['Size'] != model_size) {
            updFlag = true;
        }
        card['Size'] = model_size;

        if (originalCard['ExternalSystemName'] != config.get("cardSettings:externalSystemName")) {
            updFlag = true;
        }
        card['ExternalSystemName'] = config.get("cardSettings:externalSystemName");

        if (originalCard['ExternalCardID'] != model.get("Id")) {
            updFlag = true;
        }
        card['ExternalCardID'] = model.get("Id");

        var externalUrl = getExternalUrl(model);
        if (originalCard['ExternalSystemUrl'] != externalUrl) {
            updFlag = true;
        }
        card['ExternalSystemUrl'] = externalUrl;

        if (boardId != rules.boardId) {
            leanKitController.moveCard(originalCard["Id"], rules.boardId, function (err, response) {
                if (err) {
                    errLog.error(logMessages.errorMoveCard(err));
                } else {
                    actLog.info(logMessages.successMoveCard(originalCard["Id"], rules.boardId));
                }
            });
        }

        card['__boardId'] = rules.boardId;
        card['LaneId'] = rules.laneId;
        card['__model'] = model;

        return (updFlag) ? card : null;
    }

    /**
     * Create new card.
     */
    function attachNewCard(boardId, model, rules, availableUsers, sfUsers) {
        var externalUrl = getExternalUrl(model);

        var card = {
            Title: model.getTitle(),
            Description: model.getDescription(),
            StartDate: model.getStartDate(),
            DueDate: model.getDueDate(),
            ExternalCardID: model.getExternalId(),
            ExternalSystemName: config.get("cardSettings:externalSystemName"),
            ExternalSystemUrl: externalUrl,
            Priority: 1,
            TypeId: rules.cardTypeId,
            AssignedUserIds: model.getUsers(availableUsers, sfUsers, boardId),
            Size: model.getCardSize()
        };

        if (card['StartDate'] > card['DueDate']) {
            card['DueDate'] = "";
        }

        card['__boardId'] = boardId;
        card['__laneId'] = rules.laneId;
        card['__model'] = model;

        return card;
    }

    /**
     * Create ExternalUrl for card from model.
     */
    function getExternalUrl(model) {
        return config.get("salesforce:instance").replace(/\/$/, "") + "/" + model.get("Id");
    }
};
