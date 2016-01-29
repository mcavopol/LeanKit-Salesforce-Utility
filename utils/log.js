var log4js = require('log4js');

log4js.configure({
    appenders: [
        {
            type: "file",
            filename: "logs/error.log",
            category: 'err',
            reloadSecs: 10,
            maxLogSize: 20480,
            backups: 10
        },
        {
            type: "file",
            filename: "logs/activity.log",
            category: 'activity',
            reloadSecs: 10,
            maxLogSize: 20480,
            backups: 10
        },
        //{
        //    type: "console",
        //    level: "ERROR"
        //}
    ],
    replaceConsole: false
});

log4js.loadAppender('file');


module.exports = log4js;