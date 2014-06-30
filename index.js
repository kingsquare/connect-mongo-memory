exports = function (session) {
	var MongoStore = require('connect-mongo')(session);

	function MongoMemoryStore(options, callback) {
		var sessions = {};

		//Setup session pruning
		var pruneSession = function (sid) {
			if (sid && sessions[sid]) {
				delete sessions[sid]; // = null sux here: we really want it gone
			}
		};

		var pruneSessions = function () {
			/* jshint forin:false */
			for (var sid in sessions) {
				if (sessions[sid].lastUse < (Date.now() - (options.pruneSessionIdleTime || 3600000))) {
					pruneSession(sid);
				}
			}
			/* jshint forin:true */
			setTimeout(pruneSessions, (options.pruneInterval || 600000));
		};

		this.prototype = new MongoStore(options, callback);

		/**
		 * Attempt to fetch session by the given `sid`.
		 *
		 * @param {String} sid
		 * @param {Function} callback
		 * @api public
		 */
		this.prototype.get = function (sid, callback) {
			if (sessions[sid]) {
				sessions[sid].lastUse = Date.now();
				callback(null, sessions[sid]);
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

		this.prototype.set = function (sid, sess, fn) {
			//cache locally
			sessions[sid] = sess;
			sessions[sid].lastUse = new Date();
			fn();

			//call-back immediatly
			MongoStore.prototype.set.apply(this, [sid, sess]);
		};

		pruneSessions();
	}

	return MongoMemoryStore;
};