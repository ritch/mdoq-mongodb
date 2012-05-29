var mongodb = require('mongodb')
  , ObjectID = mongodb.ObjectID;

exports.convertObjectIdsToStrings = function (obj) {
  (function recursiveParse(object, key, parent) {
    if(Array.isArray(object)) {
      object.forEach(function (val, i) {
        recursiveParse(val, i, object);
      })
    } else if(object && typeof object == 'object') {
      if(object instanceof ObjectID) {
        parent[key] = object.toString();
      } else {
        Object.keys(object).forEach(function (key) {
          recursiveParse(object[key], key, object);
        })
      }
    }
  })(obj);
}

exports.convertStringsToObjectIds = function (obj) {
  (function recursiveParse(object, key, parent) {
    if(Array.isArray(object)) {
      object.forEach(function (val, i) {
        recursiveParse(val, i, object);
      })
    } else if(object && typeof object == 'object' && !(object instanceof ObjectID)) {   
      Object.keys(object).forEach(function (key) {
        recursiveParse(object[key], key, object);
      })
    } else if(object && typeof object == 'string' && object.length === 24) {    
      var _id = object;
      try {
        parent[key] = ObjectID.createFromHexString(object);
        // nevermind i actually liked it like that
        if(parent[key].toString() !== _id) parent[key] = _id;
      } catch(e) {
        parent[key] = _id;
      }
    }
  })(obj);
}

