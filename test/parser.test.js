var mongodb = require('mongodb')
  , parser = require('../lib/parser')
  , ObjectID = mongodb.ObjectID;
  
describe('parser', function(){
  describe('.convertObjectIdsToStrings(obj)', function(){
    function example(obj, expected) {
      parser.convertObjectIdsToStrings(obj);
      expect(obj).to.eql(expected);
    }
    
    it('should convert any value that is an object id to a string', function() {
      var oid = new ObjectID()
        , sid = oid.toString();
        
      example({_id: oid}, {_id: sid});
      example({a: [oid]}, {a: [sid]});
      example({a: [{b: oid}]}, {a: [{b: sid}]});
      example({a: [{b: [oid]}]}, {a: [{b: [sid]}]});
    })
  })
  
  describe('.convertStringsToObjectIds(obj)', function(){
    function example(obj, expected) {
      parser.convertStringsToObjectIds(obj);
      expect(obj).to.eql(expected);
    }
    
    it('should convert any value that is an object id to a string', function() {
      var oid = new ObjectID()
        , sid = oid.toString();
        
      example({_id: sid}, {_id: oid});
      example({a: [sid]}, {a: [oid]});
      example({a: [{b: sid}]}, {a: [{b: oid}]});
      example({a: [{b: [sid]}]}, {a: [{b: [oid]}]});
    })
  })
})