exports.install = function() {
  ROUTE('GET /', function() {
    this.json({ msg: 'Hello Auth Thread' });
  });
};
