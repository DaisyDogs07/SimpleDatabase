# Welcome!
This is my simple database, A database that uses fs.
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
* **Value:** The value to set
* **Returns:** A reference to the Database
### delete(path)
#### Deletes a JSON key
* **Path:** The path to the JSON key *
* **Returns:** Boolean
### get(path)
#### Gets the specified JSON key's value
* **Path:** The path to the JSON key
* **Returns:** The JSON value of the JSON key
### read()
#### Reads the JSON Object from the database file
* **Returns:** Object
###### * = Required

## Events
* Change: This event is triggered when the database file is changed by a method.
