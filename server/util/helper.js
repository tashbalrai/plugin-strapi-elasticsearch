"use strict";

const util = require("util");

const selectFields = (data, fieldsToSelect) => {
  if (typeof data != "object") {
    return;
  }
  const isArray = Array.isArray(data);

  if (!isArray && !Object.keys(data).length) {
    return;
  }

  if (isArray) {
    const values = [];
    for (const item of data) {
      let value = selectFields(item, fieldsToSelect);
      if (Object.keys(value).length) {
        values.push(value);
      }
    }
    return values;
  }
  const res = {};
  for (let field of fieldsToSelect) {
    let value = null;
    if (field.includes(".")) {
      let parts = field.split(".");
      if (undefined == data[parts[0]]) continue;

      field = parts[0];
      value = selectFields(data[parts[0]], [
        parts.shift().length > 1 ? parts.join(".") : parts[0],
      ]);
    }

    if (null === value && data[field]) {
      value = data[field];
    }

    if (!value || !Object.keys(value).length) continue;

    if (!res[field]) {
      res[field] = value;
      continue;
    }

    let curValue = res[field];
    if (!Array.isArray(curValue)) {
      curValue = [curValue];
    }
    curValue.push(value);
    res[field] = curValue.flat();
  }
  return res;
};

module.exports = {
  getDataToIndex: (event, modelConfig) => {
    const fields = modelConfig?.fields;
    const records = [];

    if (!event.state?.data?.length) {
      strapi.log.info("Elasticsearch: No event state data set.");
      return;
    }

    for (const item of event.state.data) {
      const record = selectFields(item, fields);

      if (!record) {
        continue;
      }

      record["objectID"] = item.id;
      records.push(record);
    }

    return records;
  },
};
