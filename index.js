var defer = typeof setImmediate === 'function'
		? setImmediate
		: function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) }

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
	MongoMemoryStore.prototype.get = function (sid, fn) {
		var sess = this.sessions[sid] ;
		if (!sess) {
			//try Mongo
			return MongoStore.prototype.get.apply(this, arguments);
		}

		var expires = typeof sess.cookie.expires === 'string'
				? new Date(sess.cookie.expires)
				: sess.cookie.expires;
		// destroy expired session
		if (expires && expires <= Date.now()) {
			return self.destroy(sid, fn);
		}

		this.sessions[sid].lastUse = Date.now();
		defer(fn, null, sess);
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

		//call-back immediatly...
		fn && defer(fn);

		//... and update MongoDB later
		MongoStore.prototype.set.apply(this, [sid, sess]);
	};

	return MongoMemoryStore;
};