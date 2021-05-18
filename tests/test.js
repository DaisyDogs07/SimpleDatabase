// If anything throws an error the test fails

const Database = require('../');
const database = new Database();

// Test Database constructor
new Database('test');
new Database('test.json');
new Database('test', {
  spaces: 2
});

// Test set()
database.set('a', 'a')
  .set('a', null)
  .set('a', [])
  .set('a', {})
  .set('a', () => {})
  .set('a', 1);

// Test add()
database.add('a')
  .add('a', 1);

// Test sub()
database.sub('a')
  .sub('a', 1);

// Test get()
if (database.get('a') !== 1 || database.get().toString() !== database.read().toString())
  throw new Error('get() test failed');

database.set('test', 'a');

// Testing delete()
database.delete('a');
let deleted = database.delete('test');
if (!deleted)
  throw new Error('delete() test failed');

// Test moveTo()
database.moveTo('test', false);
database.moveTo('database.json');

// Test setSpaces()
database.setSpaces(1);
database.setSpaces('1');
if (database.spaces !== 1)
  throw new Error('setSpaces() test failed');
