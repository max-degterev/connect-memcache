/*!
 * connect-memcache
 * Based on plugin by TJ Holowaychuk <tj@vision-media.ca>,
 * copied w/o much success by Michał Thoma <michal@balor.pl>
 * MIT Licensed
 */

var extend = function(result, source) {
  if (typeof result !== 'object' || typeof source !== 'object') return result;

  for (var key in source) {
    if (source.hasOwnProperty(key)) result[key] = source[key];
  }

  return result;
};

var defaults = {
  host: '127.0.0.1',
  port: '11211',
  prefix: 'sess:',
  maxAge: 86400 // one day
};

/**
 * Module dependencies.
 */

var memcache = require('memcache');

/**
 * Return the `MemcacheStore` extending `connect`'s session Store.
 *
 * @param {object} connect
 * @return {Function}
 * @api public
 */

module.exports = function(connect) {
  /**
   * Connect's Store.
   */

  var Store = connect.session.Store;

  /**
   * Initialize MemcacheStore with the given `options`.
   *
   * @param {Object} options
   * @api public
   */

  var MemcacheStore = function(options) {
    var _this = this;

    options = extend(options || {}, defaults);

    this.prefix = null || options.prefix;
    this.ttl = options.maxAge;

    Store.call(this, options);

    if (!this.client) {
      this.client = new memcache.Client(options.port, options.host, options);
      this.client.connect();
    }
  };

  /**
   * Inherit from `Store`.
   */

  MemcacheStore.prototype.__proto__ = Store.prototype;

  /**
   * Attempt to fetch session by the given `sid`.
   *
   * @param {String} sid
   * @param {Function} fn
   * @api public
   */

  MemcacheStore.prototype.get = function(sid, fn) {
    sid = this.prefix + sid;

    this.client.get(sid, function(err, data) {
      if (err) return fn(err);
      if (!data) return fn();

      var result;

      try {
        result = JSON.parse(data.toString());
      } catch (err) { fn(err); }

      fn(null, result);
    });
  };

  /**
   * Commit the given `sess` object associated with the given `sid`.
   *
   * @param {String} sid
   * @param {Session} sess
   * @param {Function} fn
   * @api public
   */

  MemcacheStore.prototype.set = function(sid, sess, fn) {
    sid = this.prefix + sid;
    try {
      var maxAge = sess.cookie.maxAge || sess.cookie.originalMaxAge,
          ttl = typeof maxAge === 'number' ? (maxAge / 1000 | 0) : this.ttl;

      sess = JSON.stringify(sess);

      this.client.set(sid, sess, function() {
        fn && fn.apply(this, arguments);
      }, ttl);
    } catch (err) { fn && fn(err); }
  };

  /**
   * Destroy the session associated with the given `sid`.
   *
   * @param {String} sid
   * @api public
   */

  MemcacheStore.prototype.destroy = function(sid, fn) {
    sid = this.prefix + sid;
    this.client.delete(sid, fn);
  };

  /**
   * Fetch number of sessions.
   *
   * @param {Function} fn
   * @api public
   */

  MemcacheStore.prototype.length = function(fn) {
    this.client.stats('items', fn);
  };

  return MemcacheStore;
};

/**
 * Library version.
 */

module.exports.version = '0.0.3';
