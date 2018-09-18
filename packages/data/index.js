const uncachedValue = {};
const getProxyData = "@@ProxyData";

function createImmutable(
  immutableMethods = {},
  mutableMethods = {},
  cache = {}
) {
  return new Proxy(cache, {
    get(target, propName) {
      if (propName === getProxyData) {
        return {
          immutable: immutableMethods,
          mutable: mutableMethods,
          cache
        };
      }

      if (propName in immutableMethods || propName in mutableMethods) {
        return function(...args) {
          let result;
          if (propName in immutableMethods) {
            result = immutableMethods[propName](...args);
            if (typeof result === "function") {
              result = result(cache);
            }
            return result;
          }

          if (propName in mutableMethods) {
            result = mutableMethods[propName](cache, ...args);

            if (result && typeof result.then === "function") {
              return result.then(payload => {
                return createImmutable(immutableMethods, mutableMethods, cache);
              });
            }
            return createImmutable(immutableMethods, mutableMethods, cache);
          }
          return undefined;
        };
      }

      return undefined;
    }
  });
}

module.exports = function(model) {
  const subscribers = [];
  const dispatchQueue = [];
  let isDispatching;

  function buildStateProxy(readOnly) {
    const cache = {};
    const changes = {};
    let disposed = false;

    function onChange(prop, data) {
      if (!changes[prop]) {
        changes[prop] = [];
      }
      changes[prop].push(data);
    }

    function $$get(propName, fromCache) {
      if (propName in cache) return cache[propName];

      if (fromCache) {
        return uncachedValue;
      }

      const loader = model[propName];

      if (typeof loader !== "function") {
        return loader;
      }

      return (cache[propName] = loader({
        type: "get",
        readOnly,
        onChange(data) {
          onChange(propName, data);
        }
      }));
    }

    function dispose() {
      disposed = true;
    }

    return new Proxy(model, {
      get(target, propName) {
        if (propName === "$$get") return $$get;
        if (propName === "$$changes") return changes;
        if (propName === "$$dispose") return dispose;

        if (!readOnly && disposed) {
          // prvent user accesses to disposed state
          // no limitation for readonly state
          throw new Error("State is already disposed");
        }

        return $$get(propName, false);
      }
    });
  }

  function getState(mapper) {
    const proxy = buildStateProxy(true);

    if (mapper) return mapper(proxy);

    return proxy;
  }

  function subscribe(subscriber) {
    subscribers.push(subscriber);
    return function() {
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
    let state;

    try {
      let actionResult = await action(...args);
      let hasChange = false;

      if (typeof actionResult === "function") {
        actionResult = await actionResult(
          (state = buildStateProxy()),
          dispatch
        );
      }

      if (actionResult) {
        if (!state) {
          state = buildStateProxy();
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

          if (
            prevValue !== nextValue &&
            typeof model[propName] === "function"
          ) {
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

      // detect change
      const changes = state.$$changes;
      for (let propName in changes) {
        hasChange = true;

        await model[propName]({
          type: "set",
          changes: changes[propName]
        });
      }

      if (hasChange) {
        notify(buildStateProxy(true));
      }
    } finally {
      isDispatching = false;
      if (state) {
        state.$$dispose();
      }
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
