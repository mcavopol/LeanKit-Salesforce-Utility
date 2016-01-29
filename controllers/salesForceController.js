var sf = require('jsforce');

module.exports = function (modules) {
    var conn = new sf.Connection({});

    var login = modules.config.get("salesforce:login");
    var password = modules.config.get("salesforce:password");
    var token = modules.config.get("salesforce:token");

    var Opportunity = modules.models.Opportunity;
    var User = modules.models.User;

    var logMessages = modules.logMessages;
    var errLog = modules.errLog;
    var actLog = modules.actLog;
    var config = modules.config;

    return {
        login: function (callback) {
            conn.login(login, password + token, function(err, userInfo) {
                if (err) {
                    errLog.error(logMessages.errorConnectToSalesForce("login", err, userInfo));
                    callback(err);
                } else {
                    callback(null, userInfo);
                }
            });
        }
        ,

        getAllUsers: function(callback){
            conn.query("SELECT Id, Name, Email FROM User ", function (err, result) {
                if (err) {
                    errLog.error(logMessages.errorGetSalesForceData("users", err, result));
                    callback(err);
                } else {
                    var users = [];
                    for (var inc in result['records']) {
                        var user = new User(result['records'][inc]);
                        user.setKey("user");
                        users.push(user);
                    }
                    actLog.info(logMessages.successGetSalesForceData("users", result.totalSize));
                    callback(null, users);
                }
            });
        }
        ,
        getAllOpportunities: function (start_date, callback) {
            conn.query("SELECT Id, Type, OwnerId, CreatedDate, CloseDate, StageName, Name, Account.Name, Amount, Description, Owner.Username, LastModifiedDate FROM Opportunity Where LastModifiedDate > " + start_date + " ORDER BY LastModifiedDate ASC LIMIT " + config.get("countPerRequest"), function (err, result) {
                if (err) {
                    errLog.error(logMessages.errorGetSalesForceData("opportunities", err, result));
                    callback(err);
                } else {
                    var opportunities = [];

                    for (var inc in result['records']) {
                        var opportunity = new Opportunity(result['records'][inc]);
                        opportunity.setKey("opportunity");
                        opportunities.push(opportunity);
                    }

                    actLog.info(logMessages.successGetSalesForceData("opportunities", result.totalSize));
                    callback(null, opportunities);
                }
            });
        }
    };
};