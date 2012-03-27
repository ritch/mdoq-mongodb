// TEST GLOBALS

expect = require('chai').expect
mdoq = require('mdoq')
user = {email: 'name@domain.com', password: 'name-pass', first: 'name', last: 'LAST-name'}
names = ["LIAM","CHARLOTTE","NOAH","SOPHIA","AIDAN","AMELIA","JACKSON","OLIVIA","CALEB","AVA","OLIVER","LILY"]
users = mdoq.use(require('../')).use('test-db').use('/users')
totalUsers = names.length

var Db = require('mongodb').Db
  , Server = require('mongodb').Server
;

var db = new Db('test-db', new Server("127.0.0.1", 27017,
 {auto_reconnect: false, poolSize: 4}), {native_parser: false});
 
function drop(fn) {
  db.open(function () {
    db.dropDatabase(function (err) {
      db.close();
      fn(err);
    })
  })
}

before(drop);
 
function clear(fn) {
  users.del(function (err) {
    fn(err);
  })
}

beforeEach(function(done){
  clear(function (err) {
    // insert test data
    var tusers = []
      , i = totalUsers
    ;
      
    while(i--) {
      var u = JSON.parse(JSON.stringify(user).replace(/name/g, names[i]));
      u.joined = i;
      
      tusers.push(u);
    }
    
    users.post(tusers, done);
  })
});

// clean up db
after(drop);