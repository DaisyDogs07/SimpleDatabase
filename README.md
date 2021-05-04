# Welcome!
This is my simple database, A database that uses fs.

## Install
```
npm i github:DaisyDogs07/SimpleDatabase
```

## Setup
```js
const Database = require('SimpleDatabase');
const database = new Database();
```

## Methods
### add(path[, amount])
#### Adds a specified amount to the JSON value
* **Path:** The path to the JSON key
* **Amount:** The amount to add
* **Returns:** A reference to the Database

### sub(path[, amount])
#### Subtracts a specified amount to the JSON value
* **Path:** The path to the JSON key
* **Amount:** The amount to subtract
* **Returns:** A reference to the Database

### set(path[, value])
#### Sets a JSON value to the new value
* **Path:** the path to the JSON key
* **Value:** The value to set
* **Returns:** A reference to the Database

### delete(path)
#### Deletes a JSON key
* **Path:** The path to the JSON key
* **Returns:** boolean

### get(path)
#### Gets the specified JSON key's value
* **Path:** The path to the JSON key
* **Returns:** The JSON value of the JSON key

### read()
#### Reads the JSON Object from the database file
* **Returns:** object

### moveTo(location[, deleteFile])
#### Moves the Database to a new file
* **Location:** The location of the new file
* **DeleteFile:** Whether to delete the previous file
* **Returns:** A reference to the Database

## Events
* Change: This event is triggered when the database file is changed by a method.