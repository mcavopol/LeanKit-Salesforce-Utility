var BaseModel = require("./baseModel");

function Opportunity() {
    BaseModel.apply(this, Array.prototype.slice.call(arguments));
}

Opportunity.prototype = new BaseModel();
Opportunity.prototype.schemaKey = 'opportunity';

Opportunity.prototype.getTitle = function() {
    return this.get("Name");
};

Opportunity.prototype.getExternalId = function() {
    return this.get("Id");
};

Opportunity.prototype.getDescription = function() {
    var description = "";
    (this.get("Account")) ? (description += "Account name: " + this.get("Account")["Name"] + "<br/>") : null;
    (this.get("Description")) ? (description += "Description: " + this.get("Description")) : null;
    return description;
};

Opportunity.prototype.getStartDate = function() {
    return (this.isset("CreatedDate")) ? (this.moment(this.get("CreatedDate")).format("MM/DD/YYYY")) : "";
};

Opportunity.prototype.getDueDate = function() {
    return (this.isset("CloseDate")) ? (this.moment(this.get("CloseDate")).format("MM/DD/YYYY")) : "";
};

Opportunity.prototype.getCardTypeIdByRules = function(rule) {
    return (rule.hasOwnProperty("opportunityCardTypeId")) ? rule['opportunityCardTypeId'] : null;
};

Opportunity.prototype.getCardTypeIdDefault = function() {
    return this.config.get("leankit:opportunityCardTypeId");
};

Opportunity.prototype.getCardSize = function() {
    return this.get("Amount");
};

Opportunity.prototype.setLastDate = function(value, modules) {
    return modules.localStore.setOpportunityLastDate(value);
};

module.exports = Opportunity;
