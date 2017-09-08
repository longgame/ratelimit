'use strict';

/**
 * Helper function to convert a callback to a Promise.
 */

var thenify = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(fn) {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return new Promise(function (resolve, reject) {
              function callback(err, res) {
                if (err) return reject(err);
                return resolve(res);
              }

              fn(callback);
            });

          case 2:
            return _context2.abrupt('return', _context2.sent);

          case 3:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function thenify(_x4) {
    return _ref3.apply(this, arguments);
  };
}();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/**
 * Module dependencies.
 */

var debug = require('debug')('koa-ratelimit');
var Limiter = require('ratelimiter');
var ms = require('ms');

/**
 * Expose `ratelimit()`.
 */

module.exports = ratelimit;

/**
 * Initialize ratelimit middleware with the given `opts`:
 *
 * - `duration` limit duration in milliseconds [1 hour]
 * - `max` max requests per `id` [2500]
 * - `db` database connection
 * - `id` id to compare requests [ip]
 * - `headers` custom header names
 *  - `remaining` remaining number of requests ['X-RateLimit-Remaining']
 *  - `reset` reset timestamp ['X-RateLimit-Reset']
 *  - `total` total number of requests ['X-RateLimit-Limit']
 *
 * @param {Object} opts
 * @return {Function}
 * @api public
 */

function ratelimit() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var _ref = opts.headers || {},
      _ref$remaining = _ref.remaining,
      remaining = _ref$remaining === undefined ? 'X-RateLimit-Remaining' : _ref$remaining,
      _ref$reset = _ref.reset,
      reset = _ref$reset === undefined ? 'X-RateLimit-Reset' : _ref$reset,
      _ref$total = _ref.total,
      total = _ref$total === undefined ? 'X-RateLimit-Limit' : _ref$total;

  return function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ctx, next) {
      var _headers;

      var id, limiter, limit, calls, headers, delta, after;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              id = opts.id ? opts.id(ctx) : ctx.ip;

              if (!(false === id)) {
                _context.next = 5;
                break;
              }

              _context.next = 4;
              return next();

            case 4:
              return _context.abrupt('return', _context.sent);

            case 5:

              // initialize limiter
              limiter = new Limiter(Object.assign({}, opts, { id: id }));

              // check limit

              _context.next = 8;
              return thenify(limiter.get.bind(limiter));

            case 8:
              limit = _context.sent;


              // check if current call is legit
              calls = limit.remaining > 0 ? limit.remaining - 1 : 0;

              // header fields

              headers = (_headers = {}, _defineProperty(_headers, remaining, calls), _defineProperty(_headers, reset, limit.reset), _defineProperty(_headers, total, limit.total), _headers);


              ctx.set(headers);

              debug('remaining %s/%s %s', remaining, limit.total, id);

              if (!limit.remaining) {
                _context.next = 17;
                break;
              }

              _context.next = 16;
              return next();

            case 16:
              return _context.abrupt('return', _context.sent);

            case 17:
              delta = limit.reset * 1000 - Date.now() | 0;
              after = limit.reset - Date.now() / 1000 | 0;

              ctx.set('Retry-After', after);

              ctx.status = 429;
              ctx.body = opts.errorMessage || 'Rate limit exceeded, retry in ' + ms(delta, { long: true }) + '.';

              if (opts.throw) {
                ctx.throw(ctx.status, ctx.body, { headers: headers });
              }

            case 23:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function ratelimit(_x2, _x3) {
      return _ref2.apply(this, arguments);
    }

    return ratelimit;
  }();
}

