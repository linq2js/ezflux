const uncachedValue = {};
const getProxyData = "@@ProxyData";

function createImmutable(dataOrCache, immutableMethods, mutableMethods) {
  const isObjectData = dataOrCache !== undefined;
  let proxy;
  if (!isObjectData) {
    dataOrCache = {};
  }

  function getPlainObjectAccessor(propName) {
    return function (value) {
      if (!arguments.length) return dataOrCache[propName];
      if (dataOrCache[propName] !== value) {
        return createImmutable(Object.assign({}, dataOrCache, { [propName]: value }));
      }
      return proxy;
    };
  }

  function getCustomObjectAccessor(propName) {
    return function (...args) {
      let result;
      if (propName in immutableMethods) {
        result = immutableMethods[propName](...args);
        if (typeof result === "function") {
          result = result(dataOrCache);
        }
        return result;
      }

      if (propName in mutableMethods) {
        result = mutableMethods[propName](dataOrCache, ...args);
        if (typeof result === "function") {
          result(dataOrCache);
        }
        return createImmutable(dataOrCache, immutableMethods, mutableMethods);
      }
      throw new Error("No method named " + propName);
    };
  }

  return proxy = new Proxy(dataOrCache, {
    get(target, propName) {
      if (isObjectData) {
        if (propName === getProxyData) return dataOrCache;
        return getPlainObjectAccessor(propName);
      }

      if (propName === getProxyData) {
        return {
          immutable: immutableMethods,
          mutable: mutableMethods,
          cache: dataOrCache
        };
      }

      return getCustomObjectAccessor(propName);
    }
  });
}

module.exports = function (model) {
  const subscribers = [];
  const dispatchQueue = [];
  let isDispatching;

  function getState(mapper) {
    const cache = {};

    function $$get(propName, fromCache) {
      if (propName in cache) return cache[propName];

      if (fromCache) {
        return uncachedValue;
      }

      const loader = model[propName];

      if (typeof loader !== "function") {
        return loader;
      }

      return cache[propName] = loader({
        type: "get"
      });
    }

    const proxy = new Proxy(model, {
      get(target, propName) {
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

  async function lazyDispatch() {
    const queue = dispatchQueue.splice();
    for (let item of queue) {
      await innerDispatch(item.action, item.args);
    }
  }

  function notify(state) {
    const unsubscribedIndexes = [];

    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i];
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

  async function innerDispatch(action, args) {
    isDispatching = true;
    try {
      let state;
      let actionResult = await action(...args);
      let hasChange = false;

      if (typeof actionResult === "function") {
        actionResult = await actionResult(state = getState(), dispatch);
      }

      if (actionResult) {
        if (!state) {
          state = getState();
        }

        for (let propName in actionResult) {
          const prevValue = state.$$get(propName, true);
          let nextValue = actionResult[propName];

          if (nextValue) {
            const proxyData = nextValue[getProxyData];
            if (proxyData) {
              nextValue = proxyData;
            }
          }

          if (prevValue !== nextValue && typeof model[propName] === "function") {
            if (prevValue !== uncachedValue && prevValue === nextValue) {
              // nothing change
            } else {
              let propChanged = await model[propName]({
                type: "set",
                cached: prevValue !== uncachedValue,
                get: () => state.$$get(propName),
                prev: prevValue === uncachedValue ? undefined : prevValue,
                next: nextValue
              });

              if (propChanged !== false) {
                hasChange = true;
              }
            }
          }
        }
      }

      if (hasChange) {
        notify(state);
      }
    } finally {
      isDispatching = false;
    }

    if (dispatchQueue.length) {
      setTimeout(lazyDispatch);
    }
  }

  function dispatch(action, ...args) {
    if (isDispatching) {
      dispatchQueue.push({ action, args });
      return;
    }
    return innerDispatch(action, args);
  }

  return {
    getState,
    subscribe,
    dispatch
  };
};

module.exports.createImmutable = createImmutable;
//# sourceMappingURL=index.js.map