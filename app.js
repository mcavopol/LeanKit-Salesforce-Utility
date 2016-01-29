var config = require("./utils/config.js");
var logger = require('./utils/log');
var logMessages = require('./utils/logMessages')();
var errLog = logger.getLogger('err');
var actLog = logger.getLogger('activity');
var CronJob = require('cron').CronJob;

var modules = {
    config: config,
    errLog: errLog,
    actLog: actLog,
    logMessages: logMessages
};

var localStore = require("./utils/localStore.js")(modules);
modules.localStore = localStore;

var models = require('./models')(modules);
modules.models = models;

var processController = require('./controllers/processController')(modules);

var cron_pattern = config.get("cron_pattern");
var in_process = false;
var runs_count = 0;

try {
    new CronJob(cron_pattern, function () {
        if (!in_process) {
            in_process = true;

            processController.run(null, function (err, data) {
                if (err) {
                    errLog.error(logMessages.process("error", err));
                } else {
                    actLog.info(logMessages.process("done", data));
                    console.log(logMessages.process("done", data));
                }
                in_process = false;
                //process.exit(0);
            });
        } else {
            if (runs_count > 50) {
                errLog.error(logMessages.cron("Job not finished yet."));
                runs_count = 0;
            }
        }
        runs_count++;
    }, function () {
        actLog.info(logMessages.cron("Ran job."));
    }, true)
} catch (ex) {
    errLog.error(logMessages.cron("Pattern not valid."));
}
