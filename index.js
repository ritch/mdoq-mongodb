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

middleware.file = function (file) {
  if(file.pause) file.pause();
  
  this.req.file = file;
  return this;
}

middleware.directory = function () {
  this.req.directory = true;
  return this;
}

middleware.rename = function (name, fn) {
  this.req = this.req || {};
  this.req.rename = name;
  exec(this, fn);
}

middleware.drop = function (err, fn) {
  this.req = this.req || {};
  this.req.drop = true;
  exec(this, fn);
}

middleware.dropDb = function (fn) {
  this.req = this.req || {};
  this.req.dropDb = true;
  exec(this, fn);
}

module.exports = middleware;