"use strict";
const { helper } = require("./util");
const util = require("util");

module.exports = ({ strapi }) => {
  const elastic = strapi.plugin("strapi-elasticsearch").service("elastic");

  elastic.loadConfig();
  strapi.log.info("Elasticsearch plugin loaded.");
  const loadEventData = async (event) => {
    elastic.config?.debug &&
      strapi.log.debug(
        `Elasticsearch: [LoadEventData()] Event name is ${event.model.uid}, Event Action: ${event.action}`
      );

    if (elastic.config?.contentTypes?.[event.model.uid]) {
      const many = event.action.toLowerCase().includes("many");
      const modelConfig = elastic.config?.contentTypes?.[event.model.uid];
      const filter = { where: event.params.where };

      if (modelConfig?.populate && Object.keys(modelConfig.populate).length) {
        filter.populate = modelConfig.populate;
      }

      const result = await strapi.db
        .query(event.model.uid)
        .findMany(filter)
        .then((result) => {
          return result;
        });

      event.state = { ...event.state, data: result };
      elastic.config?.debug &&
        strapi.log.debug(
          `Elasticsearch: [LoadEventData()] Event data has been set for event ${event.action}`
        );
    }
  };

  const dispatchEvent = async (event) => {
    elastic.config?.debug &&
      strapi.log.debug(
        `Elasticsearch: [DispatchEvent()] Event name is ${event.model.uid}, Event Action: ${event.action}`
      );
    if (elastic.config?.contentTypes?.[event.model.uid]) {
      if (!event.action.toLowerCase().includes("delete")) {
        await loadEventData(event);
      }

      elastic.index(event);
    }
  };

  strapi.db.lifecycles.subscribe({
    beforeDelete: loadEventData,
    beforeDeleteMany: loadEventData,
    afterUpdate: dispatchEvent,
    afterCreate: dispatchEvent,
    afterCreateMany: dispatchEvent,
    afterDelete: dispatchEvent,
    afterUpdateMany: dispatchEvent,
    afterDeleteMany: dispatchEvent,
  });
};
