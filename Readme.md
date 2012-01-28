# mdoq-mongodb

[mongodb native](https://github.com/christkv/node-mongodb-native) middleware for [mdoq](https://github.com/ritch/mdoq).

## Installation

    npm install mdoq-mongodb

## mdoq

Mdoq provides a consistent http style, middleware based API that lets you re-use code across different sources of data.

## Using A Database

To specify a database, simply `use()` the **mdoq-mongodb** middleware and specify a url. Credentials, port (27015), and host (localhost) are optional. 

    var db = mdoq.use(require('mdoq-mongodb')).use('mongodb://localhost/test-db');

## Using A Collection

Once your **mdoq** context is using a database, you can `use()` a specific collection.

    var users = db.use('/users');
    
## HTTP Style API

Since [mdoq](https://github.com/ritch/mdoq) implements an **http** style api, **mongodb** methods `insert()`, `find()`, `update()`, and `remove()` are exposed as `post()`, `get()`, `put()`, and `del()`.

## Executing

Queries and other operations are only executed once a callback is provided. In order to find and modify an object you can chain operations.

    users.get({age: {$gte: 21}).update({canDrink: true}, function(err, res) {
      console.log(res);
    });

## Iterators

All results will be returned unless a query is called with `each()`. This prevents buffering large sets of results, as only one result is pulled at a time.

    var log = fs.createWriteStream('./log.json');

    users.all().count().each(function(err, user, total) {
      log.write(JSON.stringify(user));
    });

## Querying

All [mongodb query objects](http://www.mongodb.org/display/DOCS/Querying#Querying-QueryExpressionObjects) are supported by passing an object as an argument to `get()`.

    users.get({last_name: 'Smith'}, function(err, res) {
      console.log(res);
    });

## Inserting

Calling `post()` will insert a document into a collection.

    users.post({name: 'Jimbo Jones'}, function(err, res) {
      console.log(res);
    });

## Updating

Updating a document requires a query and a [modifer object](http://www.mongodb.org/display/DOCS/Updating) containing modifier operations. You can also supply a regular object to replace the existing document.

    users.get({name: 'Bob'}).put({$inc: {views: 1}}, function(err, res) {
      console.log(res);
    });
    
## Deleting

Delete a document by simply calling `del()` with a query to match all the documents to be deleted.

    user.del({name: 'Bob'}, function(err, res) {
      console.log(res);
    });
    
## Modifiers

To `limit()`, `sort()`, `count()`, or otherwise modify the documents in an operation, see the [mdoq api](https://github.com/ritch/mdoq).




























