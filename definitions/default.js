const dbms = require('dbms');
if (process.env.DATABASE_URL) {
  //console.log('Using database ' + process.env.DATABASE_URL);
  dbms.init(process.env.DATABASE_URL, ERROR('DATABASE Error...'));
} else {
  dbms.init('nosql', ERROR('NOSQL Error...'))
}