"use strict";

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/*

  const createHandler => value => request => {
    request.type => get | set
    request.cached => indicate that this value is cached or not
    request.next => next value
    request.prev => prev/cached value
  };

  const handler1 = createHandler(1);
  const handler2 = createHandler(2);

  const store = createStore({
    prop1: handler1,
    prop2: handler2
  });

  const action = (...args) => state => ({ prop1: args[0], prop2: args[1] });

  store.dispatch(action, 1, 2);
*/

/*
  // add banak account sample

  cosnt store createStore({
    accounts: createMongoCollectionHandler('accounts')
  });

  const addBankAccount = (name) => state => {
    if (state.accounts.findByUser(name)) {
      throw new Error();
    }
    return {
      accounts: state.accounts.add({ username: name })
    };
  };

  store.dispatch(addBankAccount, 'newuser');

 */

describe("createStore", function () {
  test("getter and setter of handler should be called", _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var getterCalled, setterCalled, createCounterHandler, store, increaseAction, counter;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            createCounterHandler = function createCounterHandler(value) {
              return function (_ref2) {
                var type = _ref2.type,
                    next = _ref2.next;

                if (type === "get") {
                  getterCalled = true;
                  return value;
                }

                if (type === "set") {
                  setterCalled = true;
                  return value = next;
                }
              };
            };

            getterCalled = false;
            setterCalled = false;
            store = (0, _index2.default)({
              counter: createCounterHandler(0)
            });

            increaseAction = function increaseAction() {
              var by = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
              return function (state) {
                return {
                  counter: state.counter + by
                };
              };
            };

            _context.next = 7;
            return store.dispatch(increaseAction, 5);

          case 7:

            expect(getterCalled).toBe(true);
            expect(setterCalled).toBe(true);
            _context.next = 11;
            return store.getState().counter;

          case 11:
            counter = _context.sent;


            expect(counter).toBe(5);

          case 13:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  })));

  test("getter and setter of handler should be called", _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    var getterCalled, setterCalled, createCounterHandler, store, increaseAction, counter;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            createCounterHandler = function createCounterHandler(value) {
              return function (_ref4) {
                var type = _ref4.type,
                    next = _ref4.next;

                if (type === "get") {
                  getterCalled = true;
                  return value;
                }

                if (type === "set") {
                  setterCalled = true;
                  return value = next;
                }
              };
            };

            getterCalled = false;
            setterCalled = false;
            store = (0, _index2.default)({
              counter: createCounterHandler(1)
            });

            increaseAction = function increaseAction() {
              var by = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
              return function (state) {
                return {
                  counter: state.counter + by
                };
              };
            };

            _context2.next = 7;
            return store.dispatch(increaseAction, 0);

          case 7:

            expect(getterCalled).toBe(true);
            expect(setterCalled).toBe(false);
            _context2.next = 11;
            return store.getState().counter;

          case 11:
            counter = _context2.sent;


            expect(counter).toBe(1);

          case 13:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  })));
});

describe("createImmutable", function () {
  test("can get value from immutable object", function () {
    var original = (0, _index.createImmutable)({ counter: 0 });
    expect(original.counter()).toBe(0);
  });

  test("can set value to immutable object", function () {
    var original = (0, _index.createImmutable)({ counter: 0 });
    expect(original.counter(1).counter()).toBe(1);
  });

  test("immutable object should create cloned object if there is any change", function () {
    var original = (0, _index.createImmutable)({ counter: 0 });
    expect(original.counter(1)).not.toBe(original);
  });

  test("immutable object should not create cloned object if there is no change", function () {
    var original = (0, _index.createImmutable)({ counter: 0 });
    expect(original.counter(0)).toBe(original);
  });
});
//# sourceMappingURL=index.test.js.map