var expect = require('chai').expect;

var mdoq = require('mdoq')
  , user = {email: 'joe@bob.com', password: '1234', name: 'joe'}
  , users = mdoq.use(require('../')).use('test-db').use('/users')
;

describe('MongoDB Middleware', function(){
  
  it('should remove all users', function(done){
    users.del(done);
  })
  
  it('should insert a new user', function(done){
    users.post(user, function(err, res) {
      expect(res.email).to.equal(user.email);
      expect(res._id.toString()).to.be.a('string');
      done();
    })
  })
  
  it('should return a user by query', function(done){
    users.get(user, function(err, res) {
      expect(res).to.eql(user);
      done()
    })
  })

  it('should update a user by id', function(done){
    var updates = {updated: true};

    users.get({name: user.name}).put(updates, function(err, res) {  
      expect(res).to.eql(updates);
      done();
    });
  })
  
  it('should error when provided improper input', function(done){
    users
      .use(function(req, res, next) {
        this.req.query = 'a bad query';
        next();
      })
      .use('/users')
      .get(function(err, res) {
        expect(err).to.be.a('object');
        done()
      })
    ;
  })

})