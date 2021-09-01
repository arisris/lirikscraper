exports.document = createBaseRest(
  `/namespaces/${CONF.ASTRA_DB.NAMESPACE}/collections/`
);
exports.schemas = createBaseRest(`/schemas/keyspaces/`);
exports.data = createBaseRest(`/keyspaces/`);

function createBaseRest(base) {
  const obj = {};
  Object.defineProperty(obj, "baseUrl", {
    get: () => base,
    enumerable: true,
  });
  for (let method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
    Object.defineProperty(obj, method.toLowerCase(), {
      value: function(pathname, data = {}) {
        return createRequest(method, base + pathname, data);
      },
      enumerable: true,
    });
  }
  return obj;
}
function createRequest(method = "GET", pathname = "", data = {}) {
  if (method === "GET") {
    Object.keys(data).forEach((i) => {
      data[i] = JSON.stringify(data[i]);
    });
  }
  pathname = U.join("", pathname);
  const url = `https://${CONF.ASTRA_DB.ID}-${CONF.ASTRA_DB.REGION}.apps.astra.datastax.com/api/rest/v2${pathname}`;
  const builder = RESTBuilder[method.toUpperCase()](url, data);
  builder.timeout(30000);
  builder.header("X-Cassandra-Token", CONF.ASTRA_DB.APPLICATION_TOKEN);
  builder.header("X-Requested-With", "@astrajs/rest");
  return new Promise((resolve, reject) => {
    builder.callback((err, response, output) => {
      if (err) return reject(err);
      return resolve({ response, output });
    });
  });
}
