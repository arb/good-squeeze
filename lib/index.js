var Stream = require('stream');
var Hoek = require('hoek');

var internals = {};

internals.GoodSqueeze = module.exports = function (events, options) {

    options = options || {};
    options.objectMode = true;

    if (!(this instanceof internals.GoodSqueeze)) {
        return new internals.GoodSqueeze(events, options);
    }

    Stream.Transform.call(this, options);
    this._good = {
        subscription: internals.GoodSqueeze.subscription(events)
    };
};


Hoek.inherits(internals.GoodSqueeze, Stream.Transform);


internals.GoodSqueeze.prototype._transform = function (data, enc, next) {

    if (internals.GoodSqueeze.filter(this._good.subscription, data)) {
        this.push(data);
    }
    next(null);
};


// events hash of events and tags
internals.GoodSqueeze.subscription = function (events) {

    // Because we are attaching unrestricted keys from the user to result
    // we want to null the prototype to prevent issues with "hasOwnPropery" or
    // other built in keys to Object.
    var result = Object.create(null);
    var subs = Object.keys(events);

    for (var i = 0, il = subs.length; i < il; ++i) {
        var key = subs[i].toLowerCase();
        var filter = events[key];
        var tags = Array.isArray(filter) ? filter : [];

        if (filter && filter !== '*') {
            tags = tags.concat(filter);
        }

        // Force everything to be a string
        for (var j = 0, jl = tags.length; j < jl; ++j) {
            tags[j] = '' + tags[j];
        }

        result[key] = tags;
    }
    return result;
};

// subscription - results of subscription function
// events - event name
// tags - array of string tags associated with the event
internals.GoodSqueeze.filter = function (subscription, data) {

    var tags = data.tags || [];

    var subEventTags = subscription[data.event];

    // If we aren't interested in this event, break
    if (!subEventTags) {
        return false;
    }

    // If it's an empty array, we do not want to do any filtering
    if (subEventTags.length === 0) {
        return true;
    }

    // Check event tags to see if one of them is in this reports list
    if (Array.isArray(tags)) {
        var result = false;
        for (var i = 0, il = tags.length; i < il; ++i) {
            var eventTag = tags[i];
            result = result || subEventTags.indexOf(eventTag) > -1;
        }

        return result;
    }

    return false;
};
