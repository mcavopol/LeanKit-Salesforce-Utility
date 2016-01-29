var _ = require( "lodash" );
var request = require( "request-json" );
var LeanKitClientLib = require("leankit-client");

var parseReplyData = function( error, response, callback, cacheCallback ) {
    if ( error ) {
        return callback( error, response );
    } else if ( response && response.ReplyCode && response.ReplyCode > 399 ) {
        error = new Error( response.ReplyText );
        error.statusCode = response.ReplyCode;
        return callback( error );
    } else if ( response && response.ReplyCode !== 200 && response.ReplyCode !== 201 ) {
        return callback( error, response );
    } else if ( response.ReplyData && response.ReplyData.length > 0 ) {
        if ( cacheCallback ) {
            cacheCallback( response.ReplyData[ 0 ] );
        }
        return callback( error, response.ReplyData[ 0 ] );
    } else {
        return callback( error, response );
    }
};

var parseBody = function( body ) {
    var err, parsed;
    if ( typeof body === "string" && body !== "" ) {
        try {
            parsed = JSON.parse( body );
        } catch (_error) {
            err = _error;
            parsed = body;
        }
    } else {
        parsed = body;
    }
    return parsed;
};

var buildUrl = function( account ) {
    var url = "";
    if ( account.indexOf( "http://" ) !== 0 && account.indexOf( "https://" ) !== 0 ) {
        url = "https://" + account;
        // Assume leankit.com if no domain is specified
        if ( account.indexOf( "." ) === -1 ) {
            url += ".leankit.com";
        }
    } else {
        url = account;
    }
    if ( url.indexOf( "/", account.length - 1 ) !== 0 ) {
        url += "/";
    }
    return url + "kanban/api/";
};

exports.createClient = function( account, email, password, options ) {
    if ( arguments.length === 2 ) {
        options = arguments[ 1 ];
        email = null;
        password = null;
    }
    return new exports.LeanKitClient( account, email, password, options );
};

exports.LeanKitClient = (function() {
    var boardIdentifiers;
    boardIdentifiers = {};

    function LeanKitClient( account, email, password, options ) {
        options = options || {};

        var url = buildUrl( account );

        this.client = request.createClient( url, options );
        if ( password ) {
            this.client.setBasicAuth( email, password );
        }
    }

    LeanKitClient.prototype = Object.create(LeanKitClientLib.LeanKitClient.prototype);
    LeanKitClient.prototype.constructor = LeanKitClient;

    LeanKitClient.prototype.searchCardInAllBoards = function(options, callback ) {
        return this.client.post( "v1/card/search", options, function( err, res, body ) {
            return parseReplyData( err, body, callback );
        } );
    };


    return LeanKitClient;
})();