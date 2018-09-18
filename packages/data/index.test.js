import createStore, { createImmutable } from "./index";

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

describe("createStore", () => {
  test("getter and setter of handler should be called", async () => {
    let getterCalled = false;
    let setterCalled = false;
    function createCounterHandler(value) {
      return function({ type, next }) {
        if (type === "get") {
          getterCalled = true;
          return value;
        }

        if (type === "set") {
          setterCalled = true;
          return (value = next);
        }
      };
    }

    const store = createStore({
      counter: createCounterHandler(0)
    });

    const increaseAction = (by = 1) => state => ({
      counter: state.counter + by
    });

    await store.dispatch(increaseAction, 5);

    expect(getterCalled).toBe(true);
    expect(setterCalled).toBe(true);
    const counter = await store.getState().counter;

    expect(counter).toBe(5);
  });

  test("getter and setter of handler should be called", async () => {
    let getterCalled = false;
    let setterCalled = false;
    function createCounterHandler(value) {
      return function({ type, next }) {
        if (type === "get") {
          getterCalled = true;
          return value;
        }

        if (type === "set") {
          setterCalled = true;
          return (value = next);
        }
      };
    }

    const store = createStore({
      counter: createCounterHandler(1)
    });

    const increaseAction = (by = 1) => state => ({
      counter: state.counter + by
    });

    await store.dispatch(increaseAction, 0);

    expect(getterCalled).toBe(true);
    expect(setterCalled).toBe(false);
    const counter = await store.getState().counter;

    expect(counter).toBe(1);
  });
});

describe("createImmutable", () => {
  test("can get value from immutable object", () => {
    const original = createImmutable({ counter: 0 });
    expect(original.counter()).toBe(0);
  });

  test("can set value to immutable object", () => {
    const original = createImmutable({ counter: 0 });
    expect(original.counter(1).counter()).toBe(1);
  });

  test("immutable object should create cloned object if there is any change", () => {
    const original = createImmutable({ counter: 0 });
    expect(original.counter(1)).not.toBe(original);
  });

  test("immutable object should not create cloned object if there is no change", () => {
    const original = createImmutable({ counter: 0 });
    expect(original.counter(0)).toBe(original);
  });
});