var _ = require("lodash");
var schemas = require("./schemas");
var config = require("../utils/config.js");
var moment = require('moment');
var logger = require('../utils/log');
var logMessages = require('../utils/logMessages')();
var errLog = logger.getLogger('err');
var actLog = logger.getLogger('activity');

var BaseModel = function (data) {
    this.data = this.sanitize(data);
};

BaseModel.prototype.data = {};
BaseModel.prototype.key = "";
BaseModel.prototype.config = config;
BaseModel.prototype.moment = moment;

BaseModel.prototype.schemaKey = null;

BaseModel.prototype.get = function (name) {
    return this.data[name];
};

BaseModel.prototype.set = function (name, value) {
    this.data[name] = value;
};

BaseModel.prototype.setKey = function (value) {
    this.key = value;
};

BaseModel.prototype.getKey = function () {
    return this.key;
};

BaseModel.prototype.isset = function (name) {
    return (this.data.hasOwnProperty(name) && this.data[name] && this.data[name].length) ? true : false;
};

BaseModel.prototype.getTitle = function() {
    return "";
};

BaseModel.prototype.getDescription = function() {
    return "";
};

BaseModel.prototype.getExternalId = function() {
    return this.get("Id");
};

BaseModel.prototype.getCardSize = function() {
    return "";
};

BaseModel.prototype.getRules = function(config) {
    var boardId = null;
    var cardTypeId = null;
    var laneId = null;

    var key = this.getKey();

    // get data from config rules.
    var rules = config.get("rules");
    var status = this.get("StageName");
    var ownerUsername = (this.get("Owner")) ? (this.get("Owner")["Username"]) : null;
    var type = (this.get("Type")) ? (this.get("Type")) : "--None--";
    // get LineID for state
    if (rules.hasOwnProperty(ownerUsername)) {
        var rule = rules[ownerUsername];

        // Get boardId for assignment group.
        if (rule.hasOwnProperty("boardId")) {
            boardId = rule['boardId'];
        }

        // get CardTypeID by Types
        if (rule.hasOwnProperty("types")) {
            var rule_type = rule['types'];
            if (rule_type.hasOwnProperty(key)) {
                var rule_type_key = rule_type[key];
                if (rule_type_key.hasOwnProperty(type)) {
                    cardTypeId = rule_type_key[type];
                }
            }
        }
        // get LaneId by Statuses
        if (rule.hasOwnProperty("statuses")) {
            var rule_status = rule['statuses'];
            if (rule_status.hasOwnProperty(key)) {
                var rule_status_key = rule_status[key];
                if (rule_status_key.hasOwnProperty(status)) {
                    laneId = rule_status_key[status];
                }
            }
        }

        if (!laneId && rule.hasOwnProperty("defaultLaneID")) {
            laneId = rule['defaultLaneID'];
        }

        if (!cardTypeId) {
            cardTypeId = this.getCardTypeIdByRules(key, rule);
        }
    }

    if (!boardId || !cardTypeId || !laneId) {
        // Default board, lane, cardType
        boardId = config.get("leankit:boardId");

        var defaultStatus = config.get("leankit:statuses");
        if (defaultStatus.hasOwnProperty(key)) {
            var defaultStatusKey = defaultStatus[key];
            if (defaultStatusKey.hasOwnProperty(status)) {
                laneId = defaultStatusKey[status];
            }
        }

        var defaultType = config.get("leankit:types");
        if (defaultType.hasOwnProperty(key)) {
            var defaultTypeKey = defaultType[key];
            if (defaultTypeKey.hasOwnProperty(type)) {
                cardTypeId = defaultTypeKey[type];
            }
        }

        if (!laneId) {
            laneId = config.get("leankit:laneId");
        }

        if (!cardTypeId) {
            cardTypeId = this.getCardTypeIdDefault();
        }
    }

    return {
        "boardId": boardId,
        "cardTypeId": cardTypeId,
        "laneId": laneId
    };
};

BaseModel.prototype.getStartDate = function() {
    return '';
};

BaseModel.prototype.getDueDate = function() {
    return '';
};

BaseModel.prototype.sanitize = function (data, schemaKey) {
    data = data || {};
    schema = schemas[this.schemaKey];
    return _.pick(_.defaults(data, schema), _.keys(schema));
};

BaseModel.prototype.getUsers = function(availableUsers, sfUsers, boardId) {
    var assignedUsers = [];
    if (availableUsers && availableUsers.hasOwnProperty(boardId)) {
        var sfUserId = this.get("OwnerId");
        var users = availableUsers[boardId];
        for (n in users) {
            if (users[n].hasOwnProperty("EmailAddress") && users[n].hasOwnProperty("Id")) {
                var LkUsrEmail = users[n]["EmailAddress"];
                var LkUsrId = users[n]["Id"];
                if (checkIfSfUserExist(sfUsers, sfUserId, LkUsrEmail)) {
                    assignedUsers = [LkUsrId];
                }
            }
        }
    }
    return assignedUsers;
};

function checkIfSfUserExist(sfUsers, sfUserId, email) {
    for (n in sfUsers) {
        if (sfUsers[n].get("Id") == sfUserId) {
            if (sfUsers[n].get("Email") == email) {
                return true;
            }
        }
    }
    return false;
}

module.exports = BaseModel;
