# mdoq-mongodb

[mongodb native](https://github.com/christkv/node-mongodb-native) middleware for [mdoq](https://github.com/ritch/mdoq).

## Installation

    npm install mdoq-mongodb

## Connecting

Requests are buffered until a connection is available. Just provide the location of a database and start making requests.

### Using A Database

To specify a database, simply `use()` the **mdoq-mongodb** middleware and specify a url. Credentials, port (27015), and host (localhost) are optional. 

    var db = mdoq.require('mdoq-mongodb').use('mongodb://localhost/test-db');

### Using A Collection

Once you are using a database, you can `use()` a specific collection.

    var users = db.use('/users');
    
## Actions

**Mongodb** methods `insert()`, `find()`, `update()`, and `remove()` are exposed as `post()`, `get()`, `put()`, and `del()`.

### Executing

Requests are only executed once a callback is provided. In order to find and modify an object you can chain actions.

    users.get({age: {$gte: 21}).update({canDrink: true}, function(err, res) {
      console.log(res);
    });

### Querying

All [mongodb query objects](http://www.mongodb.org/display/DOCS/Querying#Querying-QueryExpressionObjects) are supported by passing an object as an argument to `get()`.

    users.get({last_name: 'Smith'}, function(err, res) {
      console.log(res); // [...]
    });

### Inserting

Calling `post()` will insert a document into a collection.

    users.post({name: 'Jimbo Jones', faux: true}, function(err, res) {
      console.log(res); // {_id: <ObjectID>, name: 'Jimbo Jones', faux: true}
    });

### Updating

Updating a document requires a query and a [modifer object](http://www.mongodb.org/display/DOCS/Updating). You can also supply a regular object to replace the existing document.

    users.get({name: 'Bob'}).put({$inc: {views: 1}}, function(err) {
      if(!err) console.info('update successful!');
    });
    
### Deleting

Delete a document by simply calling `del()` with a query to match all the documents to be deleted.

    user.get({name: 'Bob'}).del(function(err, res) {
      console.log(res);
    });
    
## Modifiers

A request can be built from a chain of actions and modifiers. Modifiers can also end the chain if passed a callback function.

    users.get({faux: true}).limit(5).skip(5).sort({name: -1}).count(function(err, res) {
      console.info(res); // [...]
    });

### Iterating

All results will be returned unless a query is called with `each()`. This prevents buffering large sets of results, as only one result is pulled at a time.

    var log = fs.createWriteStream('./log.json');

    users.each(function(err, user) {
      log.write(JSON.stringify(user));
    });

### First

Requests called with `first()` will return the first `object` or `undefined`.

    users.get({name: 'Joe'}).first(function(err, joe) {
      console.info(joe); // {name: 'Joe' ...}
    });

### Paging

    var page = 1
      , perPage = 16
    ;
    
    users.page(page, perPage).get(function(err, res) {
      console.info(res); // [...page 1 of users...]
      console.info(this.pages); // 4 (number of pages)
    });

### Sorting

Sort by a given key pattern which indicates the desired order for the result.
  
    users.sort({name: -1}).limit(16).get(function(err, sortedUsers) {
      console.info(sortedUsers); // [...]
    });

_Limit is recommended as there is a mongodb limit on the size of sorted results when an index is not used._

### Counting

Include a count separately from the results by chaining `count()`.

    users.get({name: 'Bob'}).count(function(err, bobs) {
      console.info('there are %n users named Bob', this.total);
      console.info('all the bob users:', bobs);
    });

### Limit / Skip

Like all other modifiers, `limit()` and `skip()` can be chained.

    users.skip(10).limit(10, function(err, res) {
      console.info(res); [...10 users at index 10...]
    });
    




























