# Welcome!
This is my simple database, A database that uses fs.
## Requiring and creating a database
```js
const Database = require('@daisydogs07/simpledatabase');
const database = new Database('database');
```
## Methods
### add(path, value)
#### Adds a specified amount to the JSON value
* **Path:** The path to the JSON key *
* **Value:** The amount to add. Defaults to 1
* **Returns:** A reference to the Database
### sub(path, value)
#### Subtracts a specified amount to the JSON value
* **Path:** The path to the JSON key *
* **Value:** The amount to subtract. Defaults to 1
* **Returns:** A reference to the Database
### set(path, value)
#### Sets a JSON value to the new value
* **Path:** the path to the JSON key *
* **Value:** The value to set *
* **Returns:** A reference to the Database
### delete(path)
#### Deletes a JSON key
* **Path:** The path to the JSON key (Required)
* **Returns:** A reference to the Database
### get(path)
#### Gets the specified JSON key's value
* **Path:** The path to the JSON key
* **Returns:** The JSON value of the JSON key
### read()
#### Reads the JSON Object from the database file
* **Returns:** The JSON object
###### * = Required

## Events
* Err: This event is triggered when you encounter an error. If theres no listener for this event, An error is thrown.
* Change: This event is triggered when the database file is changed by a method.

#### Install now
```
npm i @daisydogs07/simpledatabase
```
