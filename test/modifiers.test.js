describe('Modifiers', function(){
  describe('each(iterator) - iterator(err, document, index)', function(){
    it('should call the callback for every document returned from the request', function(done) {
      var called = 0;

      users
        .each(function (err, doc, index) {
          called++;
          expect(index).to.be.a('number');
          expect(doc.joined + (index + 1)).to.equal(totalUsers);
        })
        .get(function (err, all) {
          expect(called).to.equal(totalUsers);
          done(err);
        })
      ;
    })
  })
  
  describe('first([callback])', function(){
    it('should return the first result as an object', function(done) {
      users.first(function (err, doc) {
        expect(doc).to.be.a('object');
        done(err);
      })
    })
  })
  
  describe('skip(index, [callback])', function(){
    it('should skip to the index provided', function(done) {
      var skipped = 10;
      
      users.skip(skipped, function (err, res) {
        expect(res.length).to.equal(totalUsers - skipped);
        expect(res[0].joined).to.equal(totalUsers - skipped - 1);
        done(err);
      })
    })
  })
  
  describe('limit(max, [callback])', function(){
    it('should skip to the index provided', function(done) {
      var max = 10;
      
      users.limit(max, function (err, res) {
        expect(res.length).to.equal(max);
        done(err);
      })
    })
  })
  
  describe('sort(keys, [callback])', function(){
    it('should sort by the provided keys', function(done) {
      users.sort({joined: 1}, function (err, docs) {
        var joined = docs[0].joined;
        expect(joined).to.equal(0);
        done(err);
      });
    })
  })
  
  describe('count([callback])', function(){
    it('should return a count of the results', function(done) {
      users.count(function (err, docs) {
        expect(this.total).to.equal(totalUsers);
        expect(this.total).to.equal(docs.length);
        done(err);
      })
    })
  })
  
  describe('page(pageIndex, perPage, [callback])', function(){
    it('should return a page of results at the page index provided', function(done) {
      users.page(2, 3, function (err, docs) {
        expect(docs[0].joined).to.equal(totalUsers - (2 * 3) - 1);
        done(err);
      })
    })
  })
  
  describe('rename(newName, [callback])', function(){
    it('should rename the collection', function(done) {
      users.rename('admins', function (err) {
        expect(err).to.not.exist;
        var admins = mdoq
          .use(require('../'))
          .use('test-db')
          .use('/admins')
          .get(function (e, res) {
            expect(res).to.exist;
            done(e || err);
          })
        ;
      })
    })
  })
  
})