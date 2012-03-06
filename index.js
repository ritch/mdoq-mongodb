var middleware = require('./lib/middleware');

function exec(self, fn) {
  if(fn) {
    self.exec(self.req || {}, fn);
  }
}

middleware.each = function (fn) {
  this.req.iterator = fn;
  return this;
}

middleware.first = function (fn) {
  this.req.limit = 1;
  this.req.one = true;
  exec(this, fn);
  return this;
}

middleware.skip = function (index, fn) {
  this.req.skip = index;
  exec(this, fn);
  return this;
}

middleware.limit = function (max, fn) {
  this.req.limit = max;
  exec(this, fn);
  return this;
}

middleware.sort = function (keys, fn) {
  this.req.sort = keys;
  exec(this, fn);
  return this;
}

middleware.count = function (fn) {
  this.req.count = true;
  exec(this, fn);
  return this;
}

middleware.page = function (pageNum, perPage, fn) {
  this.req.limit = perPage;
  this.req.skip = pageNum * perPage;
  exec(this, fn);
  return this;
}

module.exports = middleware;