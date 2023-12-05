"use strict";

const { Client } = require("@elastic/elasticsearch");
const { helper } = require("../util");
const { errors } = require("@strapi/utils");
const { default: Helpers } = require("@elastic/elasticsearch/lib/helpers");
const { ApplicationError } = errors;
const util = require("util");

module.exports = ({ strapi }) => ({
  config: {},
  client: null,
  getClient() {
    if (null === this.client) {
      this.client = new Client({
        cloud: {
          id: this.config.cloudId,
        },
        auth: {
          apiKey: this.config.apiKey,
        },
      });
    }
    return this.client;
  },

  getConfig() {
    return this.config;
  },

  loadConfig() {
    this.config = strapi.config.get("plugin.strapi-elasticsearch");

    if (!this.config?.apiKey?.length || !this.config?.cloudId?.length) {
      strapi.log.error("Elasticsearch apiKey and cloudId must be defined.");
      return;
    }
  },

  index(event) {
    const action = event.action.toLowerCase();
    const modelConfig = this.config.contentTypes[event.model.uid];
    const client = this.getClient();

    client.helpers
      .bulk({
        datasource: helper.getDataToIndex(event, modelConfig),
        onDocument(doc) {
          if (
            event.action.toLowerCase().includes("update") &&
            event.params?.data?.publishedAt
          ) {
            return {
              create: { _index: modelConfig.indexName, _id: doc.objectID },
            };
          } else if (
            event.action.toLowerCase().includes("delete") ||
            (event.action.toLowerCase().includes("update") &&
              !event.params?.data?.publishedAt)
          ) {
            return {
              delete: { _index: modelConfig.indexName, _id: doc.objectID },
            };
          }
        },
      })
      .catch((err) => strapi.log.error("Elasticsearch Error:", err));
  },
});
