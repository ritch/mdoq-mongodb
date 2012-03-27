var mdoq = require('mdoq')
  , mongodb = require('mongodb')
  , GridStore = mongodb.GridStore
  , Db = mongodb.Db
  , Server = mongodb.Server
  , EventEmitter = require('events').EventEmitter
  , ObjectID = mongodb.ObjectID
  , Stream = require('stream').Stream
  , path = require('path')
  , dbs = {};

module.exports = function(req, res, next, use) {
  
  var partMap = ['host', 'db', 'collection']
    , context = (this.url || '').replace('mongodb://', '').split('/')
    , clen = context.length
    , i = clen
    , partName
    , part
  ;
  
  while(i--) {
    partName = partMap.pop();
    part = context[i];
    
    if(typeof part == 'number') {
      partName = 'port';
    }
    
    this[partName] = this[partName] || part;
  }
  
  var self = this
    , dbName = this.db
    , collection = this.collection
    , port = this.port || 27017
    , host = this.host || 'localhost'
  ;
  
  if(!dbName) {
    return next(new Error('When executing a mongodb req, a db name was not provided'));
  }
  
  if(!collection) {
    return next(new Error('When executing a mongodb req, a collection name was not provided'));
  }
  
  // execution
  var args = []
    , req = this.req
  ;

  // default query
  var query = req.query || {};
  
  // build file from query
  if(typeof query._id === 'string' && ~query._id.indexOf('.')) {
    req.file = req.file || {};
    req.file.path = query._id;
  }

  // convert _id's of length 24 to ObjectIDs
  if(query._id && query._id.length === 24) {
    query._id = ObjectID.createFromHexString(query._id);
  }
  
  // conver body _id's
  if(req.data && req.data._id && req.data._id.length === 24) {
    req.data._id = ObjectID.createFromHexString(req.data._id);
  }
  
  if(req.method === 'PUT') {
    args[0] = query;
    args[1] = req.data;
    
    // when updating and no query provided - update everything
    args[2] = {multi: !Object.keys(query).length};
  } else if(req.method === 'GET') {
    args[0] = query;
    if(req.fields) args[1] = req.fields;
  } else if(req.method === 'POST') {
    args[0] = req.data;
    args[1] = {safe: true};
  } else if(req.method === 'DELETE') {
    args[0] = query;
  }

  if(req.method !== 'GET') {
    args.push(function(err, result) {
      
      res.data = result;
      
      if(req.method === 'POST' && result && result.length) {
        res.data = result[0];
      }
      
      // mongodb does not return the updated document
      if(req.method === 'PUT' && !err) {
        res.data = req.data;
      }
      
      next(err);
    });
  }
  
  var key = [host, port, dbName].join('/')
    , db = dbs[key] || (dbs[key] = new Db(dbName, new Server(host, port)))
    , user = this.user
    , queue = db.queue || (db.queue = new EventEmitter());
    
  var methods = {
    'GET': 'find',
    'PUT': 'update',
    'POST': 'insert',
    'DELETE': 'remove'
  };

  function ready(err, db) {
    if(err) {
      next(err);
    } else if(req.directory) {
      // directory listing
      GridStore.list(db, collection, function (err, files) {
        res.data = files;
        next(err);
      })
      
      return;
    } else if(req.file) {
      // gridfs
      var file = req.file
        , mode = req.method === 'GET' ? 'r' : 'w';
      
      // gridstore file reference
      var gsFile = new GridStore(db, path.basename(file.path), mode, {root: collection});
      
      // PATCH - chunk size 100mb (will buffer!)
      // REMOVE - when mongodb fixes chunkSize bug
      gsFile.chunkSize = 1024 * 1024 * 100;
      
      // open the file
      gsFile.open(function (err, gsFile) {
        if(err) return next(err);
        
        if(req.method === 'DELETE') {
          gsFile.unlink(function (err, success) {
            next(err);
          })
        } else if(mode === 'w') {
          
          if(Buffer.isBuffer(file.buffer)) {                        
            gsFile.write(file, function (err) {
              gsFile.close(function (e) {
                next(err || e);
              })
            })
            
            // hault!
            return;
          }
          
          file.on('error', function () {
            gsFile.unlink(function (err, success) {
              gsFile.close(function (e) {
                next(e || err);
              });
            });
          });
          
          file.on('end', function () {
            gsFile.close(function (err) {
              next(err);
            });
          });
          
          file.on('data', function (data) {
            // dont save endoded data
            // save its binary instead
            if(typeof data == 'string') {
              data = new Buffer(data, file.encoding);
              // this can be removed once the bson
              // module supports non binary encoding
              data = data.toString('binary');
            }
            
            gsFile.write(data, function (err) {
              if(err) {
                next(err);
              }
            });
          });
                      
          file.resume();
        } else {
          res.file = gsFile;
          
          res.data = {file: gsFile};          
          next();
        }
      })
    
    } else {
      
      db.collection(collection, function(err, collection) {
        // rename support
        if(req.rename) {
          collection.rename(req.rename, function (err) {
            next(err);
          })
          
          return;
        }
        
        // atomic delete
        if(req.method === 'DELETE' && req.drop && (!req.query || !Object.keys(req.query).length)) {
          collection.drop(function (err) {
            next(err);
          });
          
          return;
        }
        
        if(req.method === 'GET') {
          var cursor = collection.find.apply(collection, args);
          
          if(req.skip) cursor.skip(req.skip);
          if(req.limit) cursor.limit(req.limit);
          if(req.sort) cursor.sort(req.sort);
          
          function each(err, doc) {
            // if there isnt a doc the cursor is finished
            if(!doc) return next(err);
            
            if(req.iterator) {
              req.iterator.call(self, err, doc, (res.data && res.data.length) || 0);
            }
            
            if(req.one) {
              res.data = doc;
            } else {
              res.data = res.data || [];
              res.data.push(doc);
            }
          }
          
          if(req.count) {
            cursor.count(function (err, count) {
              self.total = count;
              cursor.each(each);
            })
          } else {
            cursor.each(each);
          }
        } else {
          collection[methods[req.method]].apply(collection, args);
        }
      });
    }
  }
  
  if(db.isConnected) {
    ready(null, db);
  } else if(db.isConnecting) {
    db.queue.once('connected', ready);
  } else {
    // first connection
    db.queue.once('connected', ready);
    // set status
    db.isConnecting = true;
    db.open(function(err, db) {
      if(err) {
        return next(err);
      }
      
      if(!err && user) {
        db.authenticate(auth[0], auth[1], function(err, success) {
          if(success) {
            db.isConnected = true;
            db.queue.emit('connected', null, db);
          }
          else {
            next(err || (new Error('Could not authenticate user ' + user)));
          }
        });
      } else {    
          db.isConnected = true;
          db.isConnecting = false;
          db.queue.emit('connected', err, db);
      }
    });
  }

}