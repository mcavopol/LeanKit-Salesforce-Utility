"use strict";
module.exports = function (modules) {

    var
        User = require('./user'),
        Opportunity = require('./opportunity');

    return {
        User: User,
        Opportunity: Opportunity
    };
};