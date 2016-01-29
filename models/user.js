var BaseModel = require("./baseModel");

function User() {
    BaseModel.apply(this, Array.prototype.slice.call(arguments));
}

User.prototype = new BaseModel();
User.prototype.schemaKey = 'user';

module.exports = User;
