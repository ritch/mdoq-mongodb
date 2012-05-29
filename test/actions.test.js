var TEST_FILE = 'test.jpg'
  , fs = require('fs')
;

describe('Actions', function(){
  describe('get(query, [callback])', function(){
    it('should return the results matching the given query', function(done) {
      users.get({joined: {$lt: 10}}, function (err, res) {
        expect(res).to.have.length(10);
        done(err);
      })
    })
    
    it('should return the results as an array', function(done) {
      users.get({first: names[0]}, function (err, res) {
        expect(Array.isArray(res)).to.equal(true);
        done(err);
      })
    })
    
    it('should return all results if a query is not provided', function(done) {
      users.get(function (err, all) {
        expect(all).to.have.length(totalUsers);
        done(err);
      })
    })
    
    it('should only return what the query matches', function(done) {
      users.get({email: names[0] + '@domain.com'}, function (err, res) {
        expect(res).to.have.length(1);
        expect(res[0].first).to.equal(names[0]);
        done(err);
      })
    })
    
    it('should convert _id strings of length 24 to ObjectIDs and match', function(done) {
      users.get({email: names[0] + '@domain.com'}, function (err, res) {
        users.get({_id: res[0]._id.toString()}, function (err, user) {
          expect(user).to.have.length(1);
          expect(user[0].first).to.equal(names[0]);
          done(err);
        })
      })
    })
    
    function example(query, len, done) {
      users.get({email: names[0] + '@domain.com'}, function (err, res) {
        users.get(query, function (err, user) {
          if(len) expect(user).to.exist;
          expect(user).to.have.length(len);
          if(len === 1) expect(user[0].first).to.equal(names[0]);
          done(err);
        })
      })
    }
    
    it('should convert _id strings of length 24 to ObjectIDs and match inside advanced queries', function(done) {
      users.get({email: names[0] + '@domain.com'}, function (err, res) {
        example({_id: {$in: [res[0]._id.toString()]}}, 1, function (err) {
          example({_id: {$all: [res[0]._id.toString()]}}, 1, function (err) {          
            example({_id: {$ne: res[0]._id.toString()}}, names.length - 1, function (err) {
              example({$or: [{_id: res[0]._id.toString()}, {_id: 'foo'}]}, 1, done)
            })
          })
        })
      })
    })
    
    it('should not throw on an invalid _id', function(done) {
      var id = '';
      while(id.length < 24) {id += ''}
      users.get({_id: id}, done);
    })
  })
  
  describe('post(document, [callback])', function(){
    it('should insert the document', function(done) {
      var doc = {foo: 'bar'};
      
      users.post(doc, function (err, res) {        
        expect(res).to.eql(doc);
        users.get(function (err, all) {
          expect(all).to.have.length(totalUsers + 1);
          done(err);
        })
      })
    })
    
    it('should update the inserted the document object with an ObjectID', function(done) {
      var doc = {foo: 'bar'}
        , ObjectID = require('mongodb').BSONPure.ObjectID;
      
      users.post(doc, function (err, res) {        
        expect(res).to.eql(doc);
        users.get(function (err, all) {
          expect(doc._id).to.be.an.instanceof(ObjectID);
          done(err);
        })
      })
    })
    
    it('should post a file if one is provided', function(done) {      
      var fs = require('fs')
        , file = fs.createReadStream(__dirname + '/support/' + TEST_FILE)
      ;
      
      users.file(file).post(function (err, body, req, res) {
        users.get({_id: TEST_FILE}, function (err, body, req, res) {
          expect(res.file).to.exist;
          
          var stream = res.file.stream(true)
            , output = fs.createWriteStream(__dirname + '/support/' + 'out-' + TEST_FILE);

          stream
            .pipe(output)
            .on('close', function () {
              
              // compare files
              var exec = require('child_process').exec;
              
              exec(['diff', __dirname + '/support/' + TEST_FILE, __dirname + '/support/' + 'out-' + TEST_FILE].join(' '), function (differ, same) {
                expect(differ).to.not.exist;
                done();
              })
              
            })
        });
      });
    })
    
    it('should list files', function(done) {
      users.directory().get(function (err, files) {
        expect(files).to.have.length(1);
        done(err);
      })
    })
    
    
    it('should remove a file', function(done) {
      users.del({_id: TEST_FILE}, function (e) {
        done()
      });
    })
  })
  
  describe('put(changes, [callback]) or update(changes, [callback])', function(){
    it('should replace or update all documents', function(done) {
      users.put({$set: {updated: true}}, function (err) {
        users.get(function (e, all) {
          var i = totalUsers;
          
          while(i--) {
            expect(all[i].updated).to.equal(true);
          }
          
          done(err);
        })
      })
    })
    
    it('should replace the document if not using $set', function(done) {
      users.first(function (err, res) {
        users.get({_id: res._id.toString()}).put({replaced: true}, function (err) {
          users.get({_id: res._id}).first(function (e, r) {
            var expected = {replaced: true};
            delete r._id;
            expect(r).to.eql(expected);
            done(e || err);
          });
        })
      })
    })
    
    it('should update all documents matching a query', function(done) {
      var q = {first: names[0]}
        , changes = {first: 'foo'}
        , update = {$set: changes}
      ;
      
      users.get(q, function (error, existing) {
        expect(existing).to.exist;
        expect(existing[0].first).to.equal(q.first);
        users.get(q).put(update, function (e) {
          users.get(changes, function (err, res) {
            expect(res).to.exist;
            expect(res[0].first).to.equal(changes.first);
            done(error || err || e);
          })
        })
      })
    })
  })
  
  describe('del([query], [callback])', function(){
    it('should remove all documents when called without a query', function(done) {
      users.get(function (err, all) {
        expect(all).to.have.length(totalUsers);
        users.del(function (err) {
          users.get(function (e, all) {
            done(err || e);
          })
        })
      })
    })
    
    it('should remove all documents matching a query', function(done) {
      var q = {first: names[0]};
      
      users.get(q, function (error, existing) {
        expect(existing).to.exist;
        users.get(q).del(function (e) {
          users.get(q, function (err, res) {
            expect(res).to.not.exist;
            done(error || err || e);
          })
        })
      })
    })
  })
})