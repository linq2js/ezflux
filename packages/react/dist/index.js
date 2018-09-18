"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.compose = compose;
exports.connect = connect;
exports.create = create;

exports.default = function () {
  if (typeof arguments[0] !== "function" || arguments[0] && arguments[0].type === appType) {
    return create.apply(null, arguments);
  }
  return connect.apply(null, arguments);
};

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var uniqueId = new Date().getTime();
var context = _react2.default.createContext();
var wiredActionCache = {};
var appType = "@@App";
var actionType = "@@Action";

function generateId() {
  return (uniqueId++).toString(16);
}

function wire(appId, actions, dispatch) {
  var result = {};

  var _loop = function _loop(actionName) {
    var action = actions[actionName];
    if (!action.__id) {
      action.__id = generateId();
    }
    if (action.type === actionType) {
      result[actionName] = action;
      return "continue";
    }

    var cacheKey = appId + "." + action.__id;
    result[actionName] = wiredActionCache[cacheKey] || (wiredActionCache[cacheKey] = function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return dispatch.apply(undefined, [action].concat(args));
    });
  };

  for (var actionName in actions) {
    var _ret = _loop(actionName);

    if (_ret === "continue") continue;
  }
  return result;
}

function compose() {
  for (var _len2 = arguments.length, funcs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    funcs[_key2] = arguments[_key2];
  }

  return funcs.length === 1 ? funcs[0] : funcs.reduce(function (prev, next) {
    return function () {
      return prev(next.apply(undefined, arguments));
    };
  }, function (x) {
    return x;
  });
}

/**
 * copy from https://github.com/reduxjs/redux/blob/master/src/applyMiddleware.js
 */

function connect(stateToProps, actions) {
  return function (component) {
    var ComponentWrapper = function (_React$Component) {
      _inherits(ComponentWrapper, _React$Component);

      function ComponentWrapper() {
        _classCallCheck(this, ComponentWrapper);

        return _possibleConstructorReturn(this, (ComponentWrapper.__proto__ || Object.getPrototypeOf(ComponentWrapper)).apply(this, arguments));
      }

      _createClass(ComponentWrapper, [{
        key: "shouldComponentUpdate",
        value: function shouldComponentUpdate(nextProps) {
          var hasChange = false;
          for (var propName in nextProps) {
            var nextValue = nextProps[propName];
            var prevValue = this.props[propName];
            if (nextValue === prevValue ||
            // skip function type checking
            typeof nextValue === "function" && typeof prevValue === "function") continue;

            if (nextValue instanceof Date && prevValue instanceof Date) {
              if (nextValue.getTime() === prevValue.getTime()) {
                continue;
              }
            }

            hasChange = true;
            break;
          }
          return hasChange;
        }
      }, {
        key: "render",
        value: function render() {
          return _react2.default.createElement(component, this.props);
        }
      }]);

      return ComponentWrapper;
    }(_react2.default.Component);

    return function (_React$PureComponent) {
      _inherits(ConsumerWrapper, _React$PureComponent);

      function ConsumerWrapper() {
        _classCallCheck(this, ConsumerWrapper);

        return _possibleConstructorReturn(this, (ConsumerWrapper.__proto__ || Object.getPrototypeOf(ConsumerWrapper)).apply(this, arguments));
      }

      _createClass(ConsumerWrapper, [{
        key: "render",
        value: function render() {
          var _this3 = this;

          return _react2.default.createElement(context.Consumer, {}, function (contextValue) {
            return _react2.default.createElement(ComponentWrapper, stateToProps(contextValue.value, _this3.props, Object.assign({}, contextValue.actions, actions ? wire(contextValue.appId, actions, contextValue.dispatch) : undefined)));
          });
        }
      }]);

      return ConsumerWrapper;
    }(_react2.default.PureComponent);
  };
}

function create() {
  var inititalState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var actions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  for (var _len3 = arguments.length, middlewares = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
    middlewares[_key3 - 2] = arguments[_key3];
  }

  if (typeof actions === "function") {
    actions = {};
    middlewares.push(actions);
  }

  var parentApp = inititalState && inititalState.type === appType ? inititalState : undefined;
  var appId = generateId();
  var originalApi = {
    getState: function getState() {
      return parentApp ? parentApp.getState() : currentState;
    },
    subscribe: function subscribe(subscriber) {
      if (parentApp) {
        return parentApp.subscribe(subscriber);
      }

      subscribers.push(subscriber);
      return function () {
        subscriber.unsubscribed = true;
      };
    },
    dispatch: function dispatch(action) {
      for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
        args[_key4 - 1] = arguments[_key4];
      }

      if (parentApp) {
        return parentApp.dispatch.apply(parentApp, [action].concat(_toConsumableArray(args)));
      }

      if (typeof action !== "function") return action;

      var actionResult = action.apply(null, args);
      if (typeof actionResult === "function") {
        var nextState = actionResult(currentState);
        if (nextState !== currentState) {
          currentState = nextState;
          contextValue = createContextValue();
          // notify changes
          notify();
          return undefined;
        }
      }
      return actionResult;
    }
  };
  var chain = middlewares.map(function (middleware) {
    return middleware(originalApi);
  });

  var api = Object.assign({}, originalApi, {
    dispatch: compose.apply(undefined, _toConsumableArray(chain))(originalApi.dispatch)
  });

  var wiredActions = wire(appId, Object.assign({}, parentApp ? parentApp.actions : null, actions), api.dispatch);
  var subscribers = [];

  var currentState = inititalState;
  var contextValue = createContextValue();

  function createContextValue() {
    return {
      appId: appId,
      value: api.getState(),
      actions: wiredActions,
      dispatch: api.dispatch
    };
  }

  function notify() {
    var unsubscribedIndexes = [];

    for (var i = 0; i < subscribers.length; i++) {
      var subscriber = subscribers[i];
      if (subscriber.unsubcribed) {
        unsubscribedIndexes.push(i);
        continue;
      }
      subscriber(currentState);
    }
    while (unsubscribedIndexes.length) {
      subscribers.splice(unsubscribedIndexes.pop(), 1);
    }
  }

  if (parentApp) {
    parentApp.subscribe(function () {
      return contextValue = createContextValue();
    });
  }

  var provider = function (_React$PureComponent2) {
    _inherits(ProviderWrapper, _React$PureComponent2);

    function ProviderWrapper() {
      _classCallCheck(this, ProviderWrapper);

      return _possibleConstructorReturn(this, (ProviderWrapper.__proto__ || Object.getPrototypeOf(ProviderWrapper)).apply(this, arguments));
    }

    _createClass(ProviderWrapper, [{
      key: "componentDidMount",
      value: function componentDidMount() {
        var _this5 = this;

        this.unsubscribe = api.subscribe(function () {
          return _this5.forceUpdate();
        });
      }
    }, {
      key: "componentWillUnmount",
      value: function componentWillUnmount() {
        this.unsubscribe();
      }
    }, {
      key: "render",
      value: function render() {
        return _react2.default.createElement(context.Provider, { value: contextValue }, this.props.children);
      }
    }]);

    return ProviderWrapper;
  }(_react2.default.PureComponent);

  return Object.assign(provider, {
    type: appType,
    Provider: provider,
    actions: wiredActions
  }, api);
}
//# sourceMappingURL=index.js.map