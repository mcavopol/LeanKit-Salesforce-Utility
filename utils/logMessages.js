module.exports = function () {
    return {
        errorGetCardsByExternalId: function (externalId, err) {
            return "Error receiving cards by external id: " + externalId + ". Error with getting access to Leankit. "
                + "Please check your leankit data in config";
        },

        successProcessCards: function (response) {
            if (typeof response === 'string' || response instanceof String) {
                return "Process cards: " + response;
            } else {
                return "Process cards: " + JSON.stringify(response);
            }
        },

        successMoveCard: function (cardId, boardId) {
            return "Card " + cardId + " moved to board  " + boardId;
        },

        errorProcessCards: function (err, response) {
            return "Error processing cards: " + err;
        },

        errorAddCard: function (err, response) {
            return "Error add card: " + err;
        },

        errorUpdateCard: function (err, response) {
            return "Error update card: " + err;
        },

        errorSearchCardInAllBoards: function (err, response) {
            return "Error global search: " + err;
        }
        ,

        errorMoveCard: function (err, response) {
            return "Error move card: " + err;
        }
        ,

        successGetSalesForceData: function (type, totalSize) {
            return "Received " + totalSize + " " + type;
        },

        errorConnectToSalesForce: function (type, err, result) {
            if (err) {
                return "Connection error with getting " + type + ". " + err;
            }

            return "Connection error with getting " + type + ". Please check salesforce credentials.";
        },

        errorGetSalesForceData: function (type, err, result) {
            return "Error getting " + type + ". " + err;
        },

        cron: function (message) {
            return "Cron: " + message;
        },

        process: function (message, data) {
            if (typeof data === 'string' || data instanceof String) {
                return "Process: " + message + " => " + data;
            } else {
                if (data && data.length) {
                    data = "Ran " + data.length + " requests";
                } else {
                    data = JSON.stringify(data);
                }
            }

            return "Process: " + message + " => " + data;
        },

        cantSaveLAstDate: function (key, date) {
            return "Can't save last date for " + key + ": " + date;
        },

        boardsNotFound: function () {
            return "Boards not found in config";
        },

        exeption: function (exeption) {
            return "Exeption: " + exeption.name + ":" + exeption.message + "\n" + exeption.stack;
        }
    }
};