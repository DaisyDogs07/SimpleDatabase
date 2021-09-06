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
* **Options:** The options for the Database (It's an object)

## Database Options
* **Spaces:** The amount of spaces to format the file with
* **Force:** Weather to ignore unsupported file error

## Methods
### add(path\[, amount\])
#### Adds a specified amount to the JSON value
* **Path:** The path to the JSON key
* **Amount:** The amount to add
* **Returns:** A reference to the Database

### sub(path\[, amount\])
#### Subtracts a specified amount to the JSON value
* **Path:** The path to the JSON key
* **Amount:** The amount to subtract
* **Returns:** A reference to the Database

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

### moveTo(location\[, deleteFile\])
#### Moves the Database to a new file
* **Location:** The path to the new file
* **DeleteFile:** Whether to delete the previous file
* **Returns:** A reference to the Database

### setSpaces(\[amount\])
#### Sets the amount of spaces the file is formatted with
* **Amount:** The amount of spaces
* **Returns:** A reference to the Database

## Events
* Change: This event is triggered when the database file is changed by a method.
