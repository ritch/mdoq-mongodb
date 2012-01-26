var mdoq = require('mdoq')
  , mongodb = require('mongodb')
  , Db = mongodb.Db
  , Server = mongodb.Server
  , EventEmitter = require('events').EventEmitter
  , dbs = {};

module.exports = function(next) {
  
  var partMap = ['host', 'db', 'collection']
    , context = this.url.replace('mongodb://', '').split('/')
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
    return next(new Error('When executing a mongodb operation, a db name was not provided'));
  }
  
  if(!collection) {
    return next(new Error('When executing a mongodb operation, a collection name was not provided'));
  }
  
  // execution
  var args = []
    , operation = this.operation
  ;

  operation.action = operation.action || 'get';

  // default query
  operation.query = operation.query || {};

  if(operation.action === 'put') {
    args[0] = operation.query;
    args[1] = operation.data;
  } else {
    // for get, post, and del
    // the first argument is either
    // the doc or a query
    args[0] = operation.data || operation.query;
  }

  if(operation.action !== 'get') {
    args.push(function(err, result) {
      self.err = err;
      self.res = result;
      next(self.err);
    });
  }
  
  var key = [host, port, dbName].join('/')
    , db = dbs[key] || (dbs[key] = new Db(dbName, new Server(host, port)))
    , user = this.user
    , queue = db.queue || (db.queue = new EventEmitter());
    
  var actions = {
    'get': 'find',
    'put': 'update',
    'post': 'insert',
    'delete': 'remove'
  };
  
  function ready(err, db) {
    if(err) {
      next(err);
    } else {
      db.collection(collection, function(err, collection) {
        if(operation.action === 'get') {
          
          // cursor
          var cursor = collection.find.apply(collection, args)
            , limit = operation.limit || -1
            , index = 0;
          
          if(operation.skip) {
            cursor.skip(operation.skip);
          }
          
          if(operation.sort) {
            cursor.sort.apply(cursor, operation.sort);
          }
          
          cursor.nextObject(function iterator(err, doc) {
            if(doc && limit--) {
              
              if(operation.each) {
                operation.callback.call(self, err, doc, index);
              }
              
              if(operation.one) {
                self.res = doc;
                return next(err);
              } else {
                self.res = self.res || [];
                self.res.push(doc);
              }
              
              index++;
              
              // recurse
              cursor.nextObject(iterator);
            } else {
              if(!err && operation.count) {
                cursor.count(function(err, count) {
                  self.total = count;
                  next(err);
                })
              } else {
                next(err); 
              }
            }
          });
        } else {
          collection[actions[operation.action]].apply(collection, args);
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