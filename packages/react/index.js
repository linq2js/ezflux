import React from "react";

let uniqueId = new Date().getTime();
const context = React.createContext();
const wiredActionCache = {};
const appType = "@@App";
const actionType = "@@Action";

function generateId() {
  return (uniqueId++).toString(16);
}

function wire(appId, actions, dispatch) {
  const result = {};
  for (let actionName in actions) {
    const action = actions[actionName];
    if (!action.__id) {
      action.__id = generateId();
    }
    if (action.type === actionType) {
      result[actionName] = action;
      continue;
    }

    const cacheKey = appId + "." + action.__id;
    result[actionName] =
      wiredActionCache[cacheKey] ||
      (wiredActionCache[cacheKey] = function(...args) {
        return dispatch(action, ...args);
      });
  }
  return result;
}

export function compose(...funcs) {
  return funcs.length === 1
    ? funcs[0]
    : funcs.reduce((prev, next) => (...args) => prev(next(...args)), x => x);
}

/**
 * copy from https://github.com/reduxjs/redux/blob/master/src/applyMiddleware.js
 */

export function connect(stateToProps, actions) {
  return function(component) {
    class ComponentWrapper extends React.Component {
      shouldComponentUpdate(nextProps) {
        let hasChange = false;
        for (let propName in nextProps) {
          const nextValue = nextProps[propName];
          const prevValue = this.props[propName];
          if (
            nextValue === prevValue ||
            // skip function type checking
            (typeof nextValue === "function" && typeof prevValue === "function")
          )
            continue;

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

      render() {
        return React.createElement(component, this.props);
      }
    }

    return class ConsumerWrapper extends React.PureComponent {
      render() {
        return React.createElement(context.Consumer, {}, contextValue => {
          return React.createElement(
            ComponentWrapper,
            stateToProps(
              contextValue.value,
              this.props,
              Object.assign(
                {},
                contextValue.actions,
                actions
                  ? wire(contextValue.appId, actions, contextValue.dispatch)
                  : undefined
              )
            )
          );
        });
      }
    };
  };
}

export function create(inititalState = {}, actions = {}, ...middlewares) {
  if (typeof actions === "function") {
    actions = {};
    middlewares.push(actions);
  }

  const parentApp =
    inititalState && inititalState.type === appType ? inititalState : undefined;
  const appId = generateId();
  const originalApi = {
    getState() {
      return parentApp ? parentApp.getState() : currentState;
    },

    subscribe(subscriber) {
      if (parentApp) {
        return parentApp.subscribe(subscriber);
      }

      subscribers.push(subscriber);
      return function() {
        subscriber.unsubscribed = true;
      };
    },

    dispatch(action, ...args) {
      if (parentApp) {
        return parentApp.dispatch(action, ...args);
      }

      if (typeof action !== "function") return action;

      let actionResult = action.apply(null, args);
      if (typeof actionResult === "function") {
        const nextState = actionResult(currentState);
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
  const chain = middlewares.map(middleware => middleware(originalApi));

  const api = Object.assign({}, originalApi, {
    dispatch: compose(...chain)(originalApi.dispatch)
  });

  const wiredActions = wire(
    appId,
    Object.assign({}, parentApp ? parentApp.actions : null, actions),
    api.dispatch
  );
  const subscribers = [];

  let currentState = inititalState;
  let contextValue = createContextValue();

  function createContextValue() {
    return {
      appId,
      value: api.getState(),
      actions: wiredActions,
      dispatch: api.dispatch
    };
  }

  function notify() {
    const unsubscribedIndexes = [];

    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i];
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
    parentApp.subscribe(() => (contextValue = createContextValue()));
  }

  const provider = class ProviderWrapper extends React.PureComponent {
    componentDidMount() {
      this.unsubscribe = api.subscribe(() => this.forceUpdate());
    }

    componentWillUnmount() {
      this.unsubscribe();
    }

    render() {
      return React.createElement(
        context.Provider,
        { value: contextValue },
        this.props.children
      );
    }
  };

  return Object.assign(
    provider,
    {
      type: appType,
      Provider: provider,
      actions: wiredActions
    },
    api
  );
}

export default function() {
  if (
    typeof arguments[0] !== "function" ||
    (arguments[0] && arguments[0].type === appType)
  ) {
    return create.apply(null, arguments);
  }
  return connect.apply(null, arguments);
}