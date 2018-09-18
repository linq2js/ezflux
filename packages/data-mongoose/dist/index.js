const { createImmutable } = require('@ezflux/data');

function createPromise(factory) {
  return new Promise((resolve, reject) => {
    factory(function (error, payload) {
      if (error) {
        reject(error);
      } else {
        resolve(payload);
      }
    });
  });
}

function ModelHandler(model) {
  return function ({ type, onChange, readOnly }) {
    if (type === 'get') {
      return createImmutable(
      // read only methods
      {
        async find(...args) {
          return createPromise(callback => model.find(...args.concat(callback)));
        },

        async count(filter) {
          return createPromise(callback => model.countDocuments(filter, callback));
        }
      }, readOnly ? {} :
      // mutable methods
      {

        async deleteMany(filter) {
          await createPromise(callback => model.deleteMany(filter, callback));
          onChange({ action: 'deleteMany', filter });
        },
        async deleteOne(filter) {
          await createPromise(callback => model.deleteOne(filter, callback));
          onChange({ action: 'deleteOne', filter });
        },
        // define save method
        async save(context, data) {
          await new model(data).save();
          onChange({ action: 'save', data });
        }
      });
    }
  };
}

module.exports = {
  ModelHandler
};
//# sourceMappingURL=index.js.map