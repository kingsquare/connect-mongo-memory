module.exports = exports = function (session) {
	var MongoStore = require('connect-mongo')(session);

	function MongoMemoryStore(options, callback) {
		var self = this;

		MongoStore.apply(this, arguments);
		this.sessions = {};

		//Setup session pruning
		var pruneSession = function (sid) {
			if (sid && self.sessions[sid]) {
				delete self.sessions[sid]; // = null sux here: we really want it gone
			}
		};

		var pruneSessions = function () {
			/* jshint forin:false */
			for (var sid in self.sessions) {
				if (self.sessions[sid].lastUse < (Date.now() - (options.pruneSessionIdleTime || 3600000))) {
					pruneSession(sid);
				}
			}
			/* jshint forin:true */
			setTimeout(pruneSessions, (options.pruneInterval || 600000));
		};

		this.prototype = new MongoStore(options, callback);

		pruneSessions();
	}

	/**
	 * Inherit from `MongoStore`.
	 */
	MongoMemoryStore.prototype.__proto__ = MongoStore.prototype;


	/**
	 * Attempt to fetch session by the given `sid`.
	 *
	 * @param {String} sid
	 * @param {Function} callback
	 * @api public
	 */
	MongoMemoryStore.prototype.get = function (sid, callback) {
		if (this.sessions[sid]) {
			this.sessions[sid].lastUse = Date.now();
			callback(null, this.sessions[sid]);
			return;
		}
		MongoStore.prototype.get.apply(this, arguments);
	};

	/**
	 * Commit the given `sess` object associated with the given `sid`.
	 *
	 * @param {String} sid
	 * @param {Session} sess
	 * @param {Function} fn
	 * @api public
	 */

	MongoMemoryStore.prototype.set = function (sid, sess, fn) {
		//cache locally
		this.sessions[sid] = sess;
		this.sessions[sid].lastUse = new Date();
		fn();

		//call-back immediatly
		MongoStore.prototype.set.apply(this, [sid, sess]);
	};

	return MongoMemoryStore;
};