var Db = require('mongodb').Db,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON,
    fs = require('fs'),
    assert = require('assert');

var db = new Db('integration_tests', new Server("127.0.0.1", 27017,
 {auto_reconnect: false, poolSize: 1}), {native_parser: false});

describe('Test MongoDB File Write', function(){
  it('should write and read the same file', function(done) {
    // Establish connection to db
    db.open(function(err, db) {
      // Create a new file
      var gridStore = new GridStore(db, null, "w");
      // Read in the content from a file, replace with your own
      
      // This shouldnt have to be set higher than the file...
      // gridStore.chunkSize = 15000000000;
      
      // Open the file
      gridStore.open(function(err, gridStore) {
        var file = fs.createReadStream(__dirname + '/support/test.jpg')
        
        // Write the binary file data to GridFS
        file.on('data', function (chunk) {
          gridStore.write(chunk, function(err, gridStore) {
             if(err) {
               done(err);
             }
          });
        });
        
        file.on('close', function () {
          // Flush the remaining data to GridFS
           gridStore.close(function(err, result) {

             // Read in the whole file and check that it's the same content
             GridStore.read(db, result._id, function(err, fileData) {
               fs.writeFileSync(__dirname + '/support/mongodb-test.jpg', fileData);
          
               var actualData = fs.readFileSync(__dirname + '/support/test.jpg');
               
               expect(actualData.length).to.equal(fileData.length);
               expect(fileData.toString('base64')).to.equal(actualData.toString('base64'));
               
               db.close();
               done(err);
             });
           });
        });
      });
    });
  })
  
  // it('should be able to write a file from a path', function(done) {
  //   // Establish connection to db
  //   db.open(function(err, db) {
  //     // Our file ID
  //     var fileId = new ObjectID();
  // 
  //     // Open a new file
  //     var gridStore = new GridStore(db, fileId, 'w');
  // 
  //     // Read the filesize of file on disk (provide your own)
  //     var fileSize = fs.statSync(__dirname + '/support/test.jpg').size;
  //     // Read the buffered data for comparision reasons
  //     var data = fs.readFileSync(__dirname + '/support/test.jpg');
  // 
  //     // Open a file handle for reading the file
  //     var fd = fs.openSync(__dirname + '/support/test.jpg', 'r', 0666);
  // 
  //     // Open the new file
  //     gridStore.open(function(err, gridStore) {
  // 
  //       // Write the file to gridFS using the file handle
  //       gridStore.writeFile(fd, function(err, doc) {
  // 
  //         // Read back all the written content and verify the correctness
  //         GridStore.read(db, fileId, function(err, fileData) {
  //           fs.writeFileSync(__dirname + '/support/mongodb-writefile-test.jpg', fileData);
  //           
  //           require('child_process').exec(['diff', __dirname + '/support/test.jpg', __dirname + '/support/' + 'mongodb-writefile-test.jpg'].join(' '), function (differ, same) {
  //             expect(differ).to.not.exist;
  //             done();
  //           })
  //           
  //           db.close();
  //           done(err);
  //         });
  //       });
  //     });
  //   });
  // })
  
})