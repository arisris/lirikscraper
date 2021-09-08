exports.install = function() {
  ROUTE('GET /find', function() {
    this.json({ msg: 'Hello Lirik Thread' });
  });
};
