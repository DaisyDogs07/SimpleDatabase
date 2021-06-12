'use strict';

const Database = require('./'),
  fs = require('fs'),
  database = new Database(__dirname + '/');

// Testing new Database()
try {
  new Database(__dirname + '/shouldFail.js');
  console.log(new TypeError('new Database() failed'));
  process.exit(1);
} catch (e) {}
try {
  const d = new Database(__dirname + '/utils/');
  fs.unlinkSync(d.filePath);
  fs.rmdirSync(d.filePath.replace('/database.json', ''));
} catch (e) {
  console.log(new TypeError('new Database() failed'));
  process.exit(1);
}

// Testing filePath
if (database.filePath !== (__dirname + '/database.json'))
  throw new TypeError('FilePath is incorrect');

// Testing spaces
if (database.spaces !== 2)
  throw new TypeError('Spaces is incorrect');

database.clear(); // Get rid of unwanted data

// Setting up tests for add(), sub(), set(), delete(), And get()
database.set('set1', '')
  .set('set2', 1)
  .set('set3', [])
  .set('set4', {})
  .set('set5', null)
  .set('add', 1)
  .set('sub', 3)
  .set('delete', "Oh, No! I'm gonna get deleted!");

// Testing add(), And sub()
database.add('add')
  .add('add', 2);

database.sub('sub')
  .sub('sub', 2);

// Testing delete()
const deleted = database.delete('delete');
if (!deleted || database.has('delete'))
  throw new TypeError('delete() failed');

let listener = () => {
  throw new TypeError('Change event fired when not supposed to');
}

// Testing change event (While also testing set(), delete(), add(), And sub())
database.addListener('change', listener);

database.set('set1', '')
  .set('set2', 1)
  .set('set3', [])
  .set('set4', {})
  .set('set5', null)
  .set('set6', undefined);

database.delete('delete');

database.add('add', 0)
  .sub('sub', 0);

database.removeListener('change', listener);

database.set('set delete test', '');
database.set('set delete test', undefined);
if (database.has('set delete test'))
  throw new TypeError('set() failed');

listener = value => {
  if (value !== expectedValue)
    throw new TypeError(`Value didn't match expected value\nExpected: ${expectedValue}\nRecieved: ${value}`);
}

// Testing get()
let expectedValue = '';
listener(database.get('set1'));

expectedValue = 1;
listener(database.get('set2'));

expectedValue = JSON.stringify([]);
listener(JSON.stringify(database.get('set3')));

expectedValue = JSON.stringify({});
listener(JSON.stringify(database.get('set4')));

expectedValue = null;
listener(database.get('set5'));

expectedValue = undefined;
listener(database.get('set6'));

// Testing read(), And toString()
expectedValue = `{"set1":"","set2":1,"set3":[],"set4":{},"set5":null,"add":4,"sub":0}`;
listener(JSON.stringify(database.read()));

expectedValue = JSON.stringify(database.read(), null, 2);
listener(database.toString());

// Setting up find(), And findAll()
database.set('obj', {
  nest1: {
    nest2: {
      value2: "I'm a value!"
    },
    value1: 'Boo!',
    duplicateOfValue1: 'Boo!'
  }
});

// Testing find(), And findAll()
expectedValue = JSON.stringify(database.get('obj'));
listener(JSON.stringify(database.find('', v => v && v.nest1)));

expectedValue = JSON.stringify(database.get('obj.nest1'));
listener(JSON.stringify(database.find('obj', v => v.nest2 && v.nest2.value2)));

expectedValue = JSON.stringify([database.get('obj')]);
listener(JSON.stringify(database.findAll('', v => v && v.nest1)));

expectedValue = JSON.stringify([database.get('obj.nest1')]);
listener(JSON.stringify(database.findAll('obj', v => v.nest2 && v.nest2.value2)));

expectedValue = JSON.stringify([database.get('obj.nest1.value1'),database.get('obj.nest1.duplicateOfValue1')]);
listener(JSON.stringify(database.findAll('obj.nest1', v => v === 'Boo!')));

// Testing setSpaces()
[
  1,
  '1'
].forEach(a => {
  expectedValue = JSON.stringify(database.read(), null, Number(a));
  database.setSpaces(a);
  listener(database.toString());
  expectedValue = Number(a);
  listener(database.spaces);
});

// Testing moveTo()
let d = {
  str: database.toString(),
  filePath: database.filePath
};
database.moveTo(__dirname + '/database1');
if (fs.existsSync(d.filePath))
  throw new TypeError('moveTo() failed');
if (d.str !== database.toString())
  throw new TypeError('moveTo() failed');

d = {
  str: database.toString(),
  filePath: database.filePath
};
database.moveTo(__dirname + '/database2', false);
if (!fs.existsSync(d.filePath))
  throw new TypeError('moveTo() failed');
if (d.str !== database.toString())
  throw new TypeError('moveTo() failed');

// Remove all Databases for cleanup
fs.unlinkSync(database.filePath);
fs.unlinkSync(d.filePath);

console.log('Database is working properly');
