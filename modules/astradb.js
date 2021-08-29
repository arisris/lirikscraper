function createRest(method = "GET", pathname = "", data = {}) {
  if (method === "GET") {
    Object.keys(data).forEach((i) => {
      data[i] = JSON.stringify(data[i]);
    });
  }
  pathname = U.join("", pathname);
  const url = `https://${CONF.ASTRA_DB.ID}-${CONF.ASTRA_DB.REGION}.apps.astra.datastax.com/api/rest/v2/namespaces/${CONF.ASTRA_DB.NAMESPACE}${pathname}`;
  const builder = RESTBuilder[method.toUpperCase()](url, data);
  builder.timeout(30000);
  builder.header("X-Cassandra-Token", CONF.ASTRA_DB.APPLICATION_TOKEN);
  builder.header("X-Requested-With", "@astrajs/rest");
  return builder;
}

const promisifyCallback = (builder) => {
  return new Promise((resolve, reject) => {
    builder.callback((err, response, output) => {
      if (err) return reject(err);
      return resolve({ response, output, builder });
    });
  });
};

exports.get = (pathname, data = {}) =>
  promisifyCallback(createRest("GET", pathname, data));
exports.post = (pathname, data = {}) =>
  promisifyCallback(createRest("POST", pathname, data));
exports.put = (pathname, data = {}) =>
  promisifyCallback(createRest("PUT", pathname, data));
exports.patch = (pathname, data = {}) =>
  promisifyCallback(createRest("PATCH", pathname, data));
exports.delete = (pathname, data = {}) =>
  promisifyCallback(createRest("DELETE", pathname, data));