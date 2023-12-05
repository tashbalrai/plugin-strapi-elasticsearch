"use strict";
const { yup } = require("@strapi/utils");

module.exports = {
  default: {},
  validator: (config) => {
    try {
      yup
        .object()
        .shape({
          cloudId: yup.string().required(),
          apiKey: yup.string().required(),
          debug: yup.boolean(),
          contentTypes: yup.lazy((obj) => {
            const keys = Object.keys(obj);
            const shape = {};
            for (const key of keys) {
              shape[key] = yup.object({
                indexName: yup.string().required(),
                fields: yup.array().of(yup.string().required()),
              });
            }
            return yup.object(shape);
          }),
        })
        .validateSync(config);
    } catch (error) {
      strapi.log.error(`ElasticSearch plugin config error: ${error.errors}`);
    }
  },
};
