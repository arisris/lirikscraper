const options = {};

// options.ip = "127.0.0.1";
// options.port = parseInt(process.argv[2]) || 8000;
// options.unixsocket = require("path").join(require("os").tmpdir(), "app_name");
// options.unixsocket777 = true;
// options.sleep = 3000;
// options.inspector = 9229;
// options.watch = ["private"];
// options.livereload = "https://yourhostname";

// options.cluster = "auto";
// options.cluster_limit = 10; // max 10. threads (works only with "auto" scaling)

// options.timeout = 5000;
// options.threads = "/api/";
// options.logs = "isolated";

const mode = process.argv.indexOf("release", 1) !== -1 ? "release" : "debug";
require("total4/" + mode)(options);
