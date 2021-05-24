const Database = require('./'),
  fs = require('fs'),
  database = new Database(__dirname + '/database');

// Testing filePath
if (database.filePath !== (__dirname + '/database.json'))
  throw new TypeError('FilePath property is incorrect');

// Testing spaces
if (database.spaces !== 2)
  throw new TypeError('Spaces property is incorrect');

database.clear(); // Get rid of unwanted data

// Setting up tests for add(), sub(), set(), And get()
database.set('set1', '')
  .set('set2', 1)
  .set('set3', [])
  .set('set4', {})
  .set('set5', null)
  .set('add', 1)
  .set('sub', 3);

// Testing add(), And sub()
database.add('add')
  .add('add', 2);

database.sub('sub')
  .sub('sub', 2);

let listener = () => {
  throw new TypeError('Change event fired when not supposed to');
}

// Testing change event (While also testing set(), add(), And sub())
database.on('change', listener);

database.set('set1', '')
  .set('set2', 1)
  .set('set3', [])
  .set('set4', {})
  .set('set5', null)
  .set('set6', undefined);

database.add('add', 0)
  .sub('sub', 0);

database.off('change', listener);

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

// Setting up find(), And fildAll()
database.set('obj', {
  nest1: {
    nest2: {
      value2: "I'm a value!"
    },
    value1: 'Boo!',
    duplicateOfValue1: 'Boo!'
  }
});

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
  throw new TypeError(`moveTo() failed\nDidn't delete file when deleteFile was set to 'true'`);
if (d.str !== database.toString())
  throw new TypeError(`moveTo() failed\nPrevious file contents: ${d.str}\nCurrent file contents: ${database.toString()}`);

d = {
  str: database.toString(),
  filePath: database.filePath
};
database.moveTo(__dirname + '/database2', false);
if (!fs.existsSync(d.filePath))
  throw new TypeError(`moveTo() failed\nDeleted file when deleteFile was set to 'false'`);
if (d.str !== database.toString())
  throw new TypeError(`moveTo() failed\nPrevious file contents: ${d.str}\nCurrent file contents: ${database.toString()}`);

// Removing all Databases for cleanup
fs.unlinkSync(database.filePath);
fs.unlinkSync(d.filePath);

console.log('Database is working properly');