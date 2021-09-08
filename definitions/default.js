const dbms = require('dbms');
if (
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL.startsWith('mysql://')
) {
  console.log('Using database ' + process.env.DATABASE_URL);
  dbms.init(process.env.DATABASE_URL);
} else {
  console.log('Using database ' + process.env.LOCAL_DATABASE_URL);
  dbms.init(CONF.LOCAL_DATABASE_URL);
}
