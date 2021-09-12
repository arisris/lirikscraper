exports.install = function() {
  ROUTE('GET /testing-db', index);
  ROUTE('/', function() {
    this.html(`<h3>Its Works</h3>`);
  });
};

function index() {
  const self = this;
  DBMS()
    .list('lirik')
    .fields(['uid', 'songName', 'artistName'])
    .where('letter', 'en')
    .limit(10)
    .callback((err, res) => {
      if (err) return self.json({ msg: err.message });
      return self.json(res);
    });
  //this.html(`<h3>Its Works</h3>`);
}
