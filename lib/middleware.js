var mdoq = require('mdoq')
  , mongodb = require('mongodb')
  , Db = mongodb.Db
  , Server = mongodb.Server
  , EventEmitter = require('events').EventEmitter
  , dbs = {};

module.exports = function(req, res, next, use) {
  
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

  if(req.method === 'PUT') {
    args[0] = query;
    args[1] = req.data;
    // when updating and no query provided - update everything
    args[2] = {multi: !Object.keys(query).length};
  } else {
    // for get, post, and del
    // the first argument is either
    // the doc or a query
    args[0] = req.data || req.query || {};
    if(req.method === 'POST') {
      args[1] = {safe: true}
    }
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
    } else {
      db.collection(collection, function(err, collection) {  
        if(req.method === 'GET') {
          
          // cursor
          var cursor = collection.find.apply(collection, args)
            , limit = req.limit || -1
            , index = 0;
          
          if(query._id) limit = 1;
          
          if(req.skip) {
            cursor.skip(req.skip);
          }
          
          if(req.sort) {
            cursor.sort.call(cursor, req.sort);
          }
          
          cursor.nextObject(function iterator(err, doc) {
            if(doc && limit--) {

              if(req.iterator) {
                req.iterator.call(self, err, doc, index);
              }
              
              if(req.counting) {
                self.total = self.total || 0;
                self.total++;
              }
              
              if(req.one) {
                res.data = doc;
                return next(err);
              } else { 
                res.data = res.data || [];
                res.data.push(doc);

                index++;

                // recurse
                cursor.nextObject(iterator);
              }
            } else {
              next(err);
            }
          });
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