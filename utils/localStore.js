var moment = require('moment');

module.exports = function (modules) {
    var errLog = modules.errLog;
    var actLog = modules.actLog;
    var logMessages = modules.logMessages;
    var config = modules.config;


    return {
        getOpportunityLastDate: function () {
            return getLastDate('opportunityStartDate');
        },

        setOpportunityLastDate: function (value) {
            return setLastDate('opportunityStartDate', value);
        }
    };

    function getLastDate(key) {
        var start_date = config.get(key);
        if (!start_date) {
            start_date = moment("1970-01-01 00:00:00");
            start_date = start_date.format("YYYY-MM-DDTHH:mm:ss.SSSZZ");
        }
        return start_date;
    }

    function setLastDate(key, value) {
        if (value) {
            var date = moment(value);
            date.subtract(1, 'seconds');
            if (date.isValid()) {
                var newDate = date.format("YYYY-MM-DDTHH:mm:ss.SSSZZ");
                config.set(key, newDate);
                config.save(function (err) {
                    if (err) {
                        errLog.error(err.message);
                    }
                });
            } else {
                errLog.error(logMessages.cantSaveLAstDate(key, value));
            }
        }
    }
};