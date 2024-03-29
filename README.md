# Welcome!
This is my simple database, A database that uses fs.

## Install
```console
npm i github:DaisyDogs07/SimpleDatabase
```

## Setup
```js
const Database = require('SimpleDatabase');
const database = new Database();
```

## Database Parameters
* **Location:** The location of the Database file

## Methods
### set(path\[, value\])
#### Sets a JSON value to the new value
* **Path:** the path to the JSON key
* **Value:** The value to set
* **Returns:** A reference to the Database

### delete(path)
#### Deletes a JSON key
* **Path:** The path to the JSON key
* **Returns:** A reference to the Database

### get(\[path\])
#### Gets the specified JSON key's value
* **Path:** The path to the JSON key
* **Returns:** The JSON value of the JSON key

### has(path)
#### Checks if a JSON key exists
* **Path:** The path to the JSON key
* **Returns:** boolean

### find(path, fn)
#### Finds a JSON key
* **Path:** The scope of where to look
* **Fn:** The function to test with
* **Returns:** The value that succeeded in the test, 'undefined' if none were successful

### findAll(path, fn)
#### Finds JSON keys
* **Path:** The scope of where to look
* **Fn:** The function to test with
* **Returns:** An array of values that succeeded in the test, 'undefined' if none were successful

### read()
#### Reads the JSON Object from the database file
* **Returns:** The JSON object