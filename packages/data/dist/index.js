"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createImmutable = createImmutable;

exports.default = function (model) {
  var lazyDispatch = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var queue, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item;

      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              queue = dispatchQueue.splice();
              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context.prev = 4;
              _iterator = queue[Symbol.iterator]();

            case 6:
              if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                _context.next = 13;
                break;
              }

              item = _step.value;
              _context.next = 10;
              return innerDispatch(item.action, item.args);

            case 10:
              _iteratorNormalCompletion = true;
              _context.next = 6;
              break;

            case 13:
              _context.next = 19;
              break;

            case 15:
              _context.prev = 15;
              _context.t0 = _context["catch"](4);
              _didIteratorError = true;
              _iteratorError = _context.t0;

            case 19:
              _context.prev = 19;
              _context.prev = 20;

              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }

            case 22:
              _context.prev = 22;

              if (!_didIteratorError) {
                _context.next = 25;
                break;
              }

              throw _iteratorError;

            case 25:
              return _context.finish(22);

            case 26:
              return _context.finish(19);

            case 27:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this, [[4, 15, 19, 27], [20,, 22, 26]]);
    }));

    return function lazyDispatch() {
      return _ref.apply(this, arguments);
    };
  }();

  var innerDispatch = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(action, args) {
      var _this = this;

      return regeneratorRuntime.wrap(function _callee3$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              isDispatching = true;
              _context4.prev = 1;
              return _context4.delegateYield( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                var state, actionResult, hasChange, _loop, propName;

                return regeneratorRuntime.wrap(function _callee2$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        state = void 0;
                        _context3.next = 3;
                        return action.apply(undefined, _toConsumableArray(args));

                      case 3:
                        actionResult = _context3.sent;
                        hasChange = false;

                        if (!(typeof actionResult === "function")) {
                          _context3.next = 9;
                          break;
                        }

                        _context3.next = 8;
                        return actionResult(state = getState(), dispatch);

                      case 8:
                        actionResult = _context3.sent;

                      case 9:
                        if (!actionResult) {
                          _context3.next = 18;
                          break;
                        }

                        if (!state) {
                          state = getState();
                        }

                        _loop = /*#__PURE__*/regeneratorRuntime.mark(function _loop(propName) {
                          var prevValue, nextValue, proxyData, propChanged;
                          return regeneratorRuntime.wrap(function _loop$(_context2) {
                            while (1) {
                              switch (_context2.prev = _context2.next) {
                                case 0:
                                  prevValue = state.$$get(propName, true);
                                  nextValue = actionResult[propName];


                                  if (nextValue) {
                                    proxyData = nextValue[getProxyData];

                                    if (proxyData) {
                                      nextValue = proxyData;
                                    }
                                  }

                                  if (!(prevValue !== nextValue && typeof model[propName] === "function")) {
                                    _context2.next = 11;
                                    break;
                                  }

                                  if (!(prevValue !== uncachedValue && prevValue === nextValue)) {
                                    _context2.next = 7;
                                    break;
                                  }

                                  _context2.next = 11;
                                  break;

                                case 7:
                                  _context2.next = 9;
                                  return model[propName]({
                                    type: "set",
                                    cached: prevValue !== uncachedValue,
                                    get: function get() {
                                      return state.$$get(propName);
                                    },
                                    prev: prevValue === uncachedValue ? undefined : prevValue,
                                    next: nextValue
                                  });

                                case 9:
                                  propChanged = _context2.sent;


                                  if (propChanged !== false) {
                                    hasChange = true;
                                  }

                                case 11:
                                case "end":
                                  return _context2.stop();
                              }
                            }
                          }, _loop, _this);
                        });
                        _context3.t0 = regeneratorRuntime.keys(actionResult);

                      case 13:
                        if ((_context3.t1 = _context3.t0()).done) {
                          _context3.next = 18;
                          break;
                        }

                        propName = _context3.t1.value;
                        return _context3.delegateYield(_loop(propName), "t2", 16);

                      case 16:
                        _context3.next = 13;
                        break;

                      case 18:

                        if (hasChange) {
                          notify(state);
                        }

                      case 19:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee2, _this);
              })(), "t0", 3);

            case 3:
              _context4.prev = 3;

              isDispatching = false;
              return _context4.finish(3);

            case 6:

              if (dispatchQueue.length) {
                setTimeout(lazyDispatch);
              }

            case 7:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee3, this, [[1,, 3, 6]]);
    }));

    return function innerDispatch(_x, _x2) {
      return _ref2.apply(this, arguments);
    };
  }();

  var subscribers = [];
  var dispatchQueue = [];
  var isDispatching = void 0;

  function getState(mapper) {
    var cache = {};

    function $$get(propName, fromCache) {
      if (propName in cache) return cache[propName];

      if (fromCache) {
        return uncachedValue;
      }

      var loader = model[propName];

      if (typeof loader !== "function") {
        return loader;
      }

      return cache[propName] = loader({
        type: "get"
      });
    }

    var proxy = new Proxy(model, {
      get: function get(target, propName) {
        if (propName === "$$get") return $$get;
        return $$get(propName, false);
      }
    });

    if (mapper) return mapper(proxy);

    return proxy;
  }

  function subscribe(subscriber) {
    subscribers.push(subscriber);
    return function () {
      subscriber.unsubcribed = true;
    };
  }

  function notify(state) {
    var unsubscribedIndexes = [];

    for (var i = 0; i < subscribers.length; i++) {
      var subscriber = subscribers[i];
      if (subscriber.unsubcribed) {
        unsubscribedIndexes.push(i);
        continue;
      }
      subscriber(state);
    }
    while (unsubscribedIndexes.length) {
      subscribers.splice(unsubscribedIndexes.pop(), 1);
    }
  }

  function dispatch(action) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    if (isDispatching) {
      dispatchQueue.push({ action: action, args: args });
      return;
    }
    return innerDispatch(action, args);
  }

  return {
    getState: getState,
    subscribe: subscribe,
    dispatch: dispatch
  };
};

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var uncachedValue = {};
var getProxyData = "@@ProxyData";

function createImmutable(dataOrCache, immutableMethods, mutableMethods) {
  var isObjectData = dataOrCache !== undefined;
  var proxy = void 0;
  if (!isObjectData) {
    dataOrCache = {};
  }
  return proxy = new Proxy(dataOrCache, {
    get: function get(target, propName) {
      if (isObjectData) {
        if (propName === getProxyData) return dataOrCache;

        return function (value) {
          if (!arguments.length) return dataOrCache[propName];
          if (dataOrCache[propName] !== value) {
            return createImmutable(Object.assign({}, dataOrCache, _defineProperty({}, propName, value)));
          }
          return proxy;
        };
      } else {
        if (propName === getProxyData) {
          return {
            immutable: immutableMethods,
            mutable: mutableMethods,
            cache: dataOrCache
          };
        }

        return function (value) {
          if (!arguments.length) {
            if (propName in immutableMethods) {
              if (propName in dataOrCache) return dataOrCache[propName];
              return dataOrCache[propName] = immutableMethods[propName](dataOrCache);
            }
            throw new Error("No immutable method named " + propName);
          }

          if (propName in mutableMethods) {
            dataOrCache[propName] = mutableMethods[propName](value, dataOrCache);
            return createImmutable(dataOrCache, immutableMethods, mutableMethods);
          }
          throw new Error("No mutable method named " + propName);
        };
      }
    }
  });
}
//# sourceMappingURL=index.js.map