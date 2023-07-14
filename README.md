# Sunshine
Sunshine is a simple MongoDB ODM (object data modeling) made for 
Node.js to work with nosql Mongo database systems.

# Table of contents
1. [Installation](#installation)
2. [Import](#import)
3. [Usage](#usage)
   1. [Connection](#connection)
   2. [Model](#model)
      1. [Decorators](#decorators)
         1. [Data type decorators](#data-type-decorators)
            1. [ObjectId](#objectid)
            2. [Number](#number)
            3. [Text](#text)
            4. [Boolean](#boolean)
            5. [Email](#email)
            6. [Date](#date)
         2. [Required decorator](#required-decorator)
         3. [Encrypted decorator](#encrypted-decorator)
      2. [Read items from MongoDB](#read-items-from-mongodb)
         1. [Find one](#find-one)
         2. [Find](#find)
         3. [Aggregate](#aggregate)
         4. [Distinct](#distinct)
      3. [Create and update](#create-and-update)
         1. [Create](#create)
         2. [Update](#update)

## Installation
To work with Sunshine you must first have node installed on 
local machine. There must be some running mongo database to 
connect to:
1. [Docker](https://hub.docker.com/_/mongo)
2. [Localhost](https://www.mongodb.com/docs/manual/administration/install-community/)
3. Cloud (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas/database))

## Import
The import can be done with ES6 standard:
```typescript
import { Sunshine } from 'sunshine-dao/lib';
```
Or with CommonJs standard:
```typescript
const Sunshine = require('sunshine-dao/lib');
```

## Usage
Sunshine is very easy to use object data modeling system designed
to be used with Node.js applications.

### Connection
Sunshine uses two ways of establishing a connection:
1. `connect()`
2. `connectUri()`

The `connect` method is requiring `hostname`, `username`, `password`,
`database` and optionally `encryptionKey`.
```typescript
import { Sunshine } from './Sunshine';

await Sunshine.connect('127.0.0.1', 'user', 'pass', 'test_db');
```

On the other hand, with `connectUri` you just pass connection
string to the method.
```typescript
import { Sunshine } from './Sunshine'

await Sunshine.connectURI('mongodb://127.0.0.1/test_db');
```

After successful connection, the `Sunshine` class is taking care
of active connection and is exposing some important methods:
1. `getConnection()` - Return mongo `Db` object which allows
direct access to all driver methods
2. `disconnect()`
3. `getEncryptionKey()`
4. `setEncryptionKey(key: string)`
5. `on(event: string, callback: (event) => void)` - Listen to
events from `eventEmitter`
6. `event(name: string, payload: any)` - Emit new event

### Model
Each collection in mongodb should be represented with one `Model`
class. Here is an example of model usage, but for examples take
a look at the `test` folder.

```typescript
import { ObjectId } from 'mongodb'
import { Collection, Model } from './Model'

@Collection('users')
export class User extends Model {
  _id: ObjectId;
  email: string;
  password: string;
  
  firstname?: string;
  lastname?: string;
}
```
Model class needs to have decorator `Collection()` where argument
passed is the name of collection in MongoDB. 

### Decorators
Model has various decorators which are used for data validation
and speed up the development process. There are a couple of 
decorator types:
1. [Data type decorators](#data-type-decorators)
2. [Required decorator](#required-decorator)
3. [Encrypted decorator](#encrypted-decorator)

### Data type decorators
There are multiple Data type decorators, but are all explained 
bellow.

### ObjectId
This is just simple validation type where decorator is checking 
if specified field is valid `ObjectId`.
```typescript
class TestModel extends Model {
  
  @objectid()
  customer_id: ObjectId;  
}
```

### Number
Number data type decorator has multiple features. It is validating
if data passed in the variable is valid and also there is a 
possibility to specify `min`, `max` and `defaultValue` values.
```typescript
class TestModel extends Model {

  @number({ min: 10, max: 100, defaultValue: 0 })
  price: number; 
}
```
Values for `min` and `max` are validation values, when used will check each
time `save()` is called on the model class (e.g. `await user.save()`). On the other hand
`defaultValue` is not used for validation, but for adding value if one is missing before
storing object in the database.

### Text
Text decorator is validating if data passed is really of `string` type, and it has 
additional parameters `match` and `defaultValue` which can also be used.
```typescript
class TestModel extends Model {
  
  @text({ match: /^[^0-9]+$/, defaultValue: 'test' })
  name: string;  
}
```
In the text decorator `match` is used for validating strings based on the `RegExp`
provided as parameter and `defaultValue` is working the same way as `number` decorator.

### Boolean
This is just simple validation type where decorator is checking
if specified field is valid `boolean` type.
```typescript
class TestModel extends Model {
  
  @boolean()
  active: boolean;  
}
```

### Email
This is just simple validation type where decorator is checking
if specified field is valid `email` string type.
```typescript
class TestModel extends Model {
  
  @email()
  email: boolean;  
}
```

### Date
Date data type decorator has multiple features. It is validating
if data passed in the variable is valid and also there is a
possibility to specify `min`, `max` and `defaultValue` values.
```typescript
class TestModel extends Model {

  @date({
    min: new Date(1990, 0, 1),
    max: new Date(2010, 11, 31),
    defaultValue: new Date(2010, 0, 1)
  })
  birth_date: Date; 
}
```
The logic behind `min`, `max` and `defaultValue` is the same as on th `number` decorator

### Required decorator
When specifying model for some database collection there is often requirement to check 
if some minimum fields are existing. For that `required` decorator is used.
```typescript
class TestModel extends Model {
  
  @required()
  @email()
  email: boolean;  
}
```

### Encrypted decorator
There is also a possibility to encrypt some keys using `Encrypted` decorator.
```typescript
class TestModel extends Model {
  
  @Encrypted()
  wallet: boolean;  
}
```
When using `Encrypted` decorator each time you are saving item in the database or reading
from database the decorator is automatically encrypting and decrypting fields.

### Read items from MongoDB
When querying items from database Sunshine is providing four main actions `findOne`,
`find`, `aggregate` and `distinct`. There is a possibility to use them when reading data 
from the database.

### Find one
To query only one item from the database we can use `findOne` method. When using this 
action MongoDB is going to return the first item found in the database matching the query
and return it.
```typescript
const user = await User.findOne<User>(
  { email: 'test@test.com' },
  { projection: { email: true } }
);
```
We need to pass the type before invoking the function so that typescript knows what
model is returned from the database.
First argument of the method is query defined by 
[MongoDB](https://www.mongodb.com/docs/manual/reference/method/db.collection.findOne/),
and second argument are the options defined by the 
mongo driver for nodejs [FindOptions](https://github.com/mongodb/node-mongodb-native/blob/8693987b66dff745c8421ac9cdc29dc772b1f675/src/operations/find.ts#L26).

### Find
When querying multiple documents from the database there is action called `find` which is 
returning multiple documents. That to convert response into array we need to call 
`.toArray()` after the function invocation.
```typescript
const users = await User.find<User>(
  { active: true },
  { 
    limit: 10, 
    skip: 20,
    sort: { firstname: 1 } 
  }
).toArray();
```
`Find` has the same rules as [Find one](#find-one) has regarding arguments in the method.

### Aggregate
Besides `find` action, there is also a possibility to use the [aggregate](https://www.mongodb.com/docs/manual/reference/method/db.collection.aggregate/) 
function with all the available operators provided by MongoDB (list of operators can be
found on this [link](https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/)).
```typescript
const users = await User.aggregate<User>(
  [
     { $match: { active: true } },
     { $limit: 10 },
     { $skip: 20 },
     { sort: { firstname: 1 } }
  ],
  { allowDiskUse: true }
).toArray();
```
The second argument in the function are the [AggregateOptions](https://github.com/mongodb/node-mongodb-native/blob/db356358f93e01e597466992a9910f6fe63ab091/src/operations/aggregate.ts#L19)
provided by the native mongodb driver for Node.js

### Distinct
Distinct action is going to return array of all the unique values found in the database 
of a specific field.
```typescript
const firstnames = await Customer.distinct('firstname', {});
```
More information about distinct can be found in official Mongo [docs](https://www.mongodb.com/docs/manual/reference/method/db.collection.distinct/).

### Create and update
To make things easier there is one method exposed on the Model object for creating and
updating the object in database, it is called `save`.

#### Create
When creating new object for inserting into database we must first create it in memory.
After all the data is prepared and object is ready we just call method `save` on the 
Model object like bellow.
```typescript
const customer = new Customer();

customer.firstname = 'Test';
customer.title = 'Mr';
customer.email = 'test@test.com';

await customer.save();
```

#### Update
When updating the model we must first query it from the database using any of the 
[read functions](#read-items-from-mongodb).

```typescript
const customer = Customer.findOne<Customer>({ email: 'test@test.com' });
if (!customer)
  throw new Error('Missing customer');

customer.firstname = 'John';
customer.lastname = 'Smith';

await customer.save();
```
Besides loading Model from the database and then using `save` method there are also two
actions included directly on the Model in Sunshine: `updateOne` and `updateMany`.
```typescript
// Update one
await Customer.updateOne(
  { email: 'test@test.com' },
  { $set: {
      firstname: 'John',
      lastname: 'Smith'
    } 
  }
);

// Update many
await Customer.updateMany(
  { active: false },
  { $set: { active: true } }
);
```
Those two actions can be used the sam way you would call in MongoDB, so whole documentation
is explained here: 
1. [Update one](https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/)
2. [Update many](https://www.mongodb.com/docs/manual/reference/method/db.collection.updateMany/)
