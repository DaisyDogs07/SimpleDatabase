const fs = require('fs'),
  path = require('path'),
  {EventEmitter} = require('events');

/**
 * The options for the Database
 */
class DatabaseOptions {
  constructor(spaces = 2) {
    this.spaces = Number(spaces);
  }
}
/**
 * The main Database class for creating a database
 */
class Database extends EventEmitter {
  /**
   * Makes a new database. If the file is not present, We'll make it for you
   * @param {string} Location The path to the file
   * @param {DatabaseOptions} Options The options to give when creating the database
   */
  constructor(location = './Database/All', options = new DatabaseOptions) {
    super();
    if (typeof location !== 'string')
      throw new TypeError('Location must be a string');
    if (location.startsWith('/'))
      throw new TypeError('Absolute paths are not supported yet');
    if (typeof options !== 'object')
      throw new TypeError('Options must be an object');
    if (typeof options.spaces !== 'number')
      throw new TypeError('Spaces option must be a number');
    if (options.spaces > 4)
      options.spaces = 4;
    let loca = location.replace(/..\/|.\//g, '').split('.');
    if (loca.length !== 1)
      if (loca[loca.length - 1] && loca[loca.length - 1] !== 'json')
        throw new TypeError(`File extension '${loca[loca.length - 1]}' is not supported, Please use the 'json' file extension`);
    if (location.endsWith('.json'))
      location = location.slice(0, -5);
    let dir = location.split('/');
    delete dir[dir.length - 1];
    dir = dir.join('/');
    loca = location.replace(dir, '');
    let filePath = `${path.resolve(dir)}/${loca}.json`;
    if (!fs.existsSync(dir))
      fs.mkdirSync(path.resolve(dir), {
        recursive: true
      });
    if (!fs.existsSync(filePath))
      fs.closeSync(fs.openSync(filePath, 'w'));
    process.env.DatabaseSpaces = options.spaces;
    this.FilePath = filePath;
    fs.writeFileSync(filePath, JSON.stringify(this.read(), null, Number(this.spaces)));
  }
  /**
   * This indecates the amount spaces in the database file (Can also make it easier to read). Setting this value will update the database file
   */
  get spaces() {
    return process.env.DatabaseSpaces;
  }
  set spaces(num) {
    if (!Number(num) && Number(num) !== 0)
      throw new TypeError("Cannot set property 'spaces' to " + (function(){return typeof num==='object'?num===null?'':'an ':typeof num==='undefined'?'':'a '}()) + (function(){return num===null?'null':typeof num}()));
    if (num > 4)
      num = 4;
    let data = this.read();
    fs.writeFileSync(this.FilePath, JSON.stringify(this.read(), null, Number(num)));
    this.emit('change', null, this.read(), data);
    process.env.DatabaseSpaces = num;
    return Number(num);
  }
  toString() {
    return JSON.stringify(this.read());
  }
  /**
   * Adds a specified amount to the JSON key
   * @param {string} Path The path to the JSON key
   * @param {number} Amount The amount to add
   */
  add(path, amount = 1) {
    if (!path)
      throw new TypeError('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (!isNaN(Number(path.charAt(0))))
      throw new TypeError('Path cannot start with a number');
    if (typeof amount !== 'number')
      throw new TypeError('Amount must be a number');
    path = path.replace(/ /g, '');
    let data = this.get(path);
    if (typeof data === 'number')
      data += Number(amount);
    else data = Number(amount);
    this.set(path, data);
    return this;
  }
  /**
   * Subtracts a specified amount to the JSON key
   * @param {string} Path The path to the JSON key
   * @param {number} Amount The amount to subtract
   */
  sub(path, amount = 1) {
    if (!path)
      throw new TypeError('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (!isNaN(Number(path.charAt(0))))
      throw new TypeError('Path cannot start with a number');
    if (typeof amount !== 'number')
      throw new TypeError('Amount must be a number');
    path = path.replace(/ /g, '');
    let data = this.get(path);
    if (typeof data === 'number')
      data -= Number(amount);
    else data = Number(amount);
    this.set(path, data);
    return this;
  }
  /**
   * Gets the specified JSON key
   * @param {string} Path The path to the JSON key
   */
  get(path) {
    if (!path)
      return this.read();
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (!isNaN(Number(path.charAt(0))))
      throw new TypeError('Path cannot start with a number');
    path = path.replace(/ /g, '');
    return _get(path, this.read());
  }
  /**
   * Sets a JSON key to the new value
   * @param {string} Path the path to the JSON key
   * @param {number} Value The value to set
   */
  set(path, value) {
    if (!path)
      throw new TypeError('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (!isNaN(Number(path.charAt(0))))
      throw new TypeError('Path cannot start with a number');
    if (typeof value === 'function')
      value = value.toString();
    path = path.replace(/ /g, '');
    let data = this.read();
    data = _set(path, value, data);
    this.emit('change', path, this.read(), data);
    fs.truncateSync(this.FilePath);
    fs.writeFileSync(this.FilePath, JSON.stringify(data, null, Number(this.spaces)), 'utf8');
    return this;
  }
  /**
   * Deletes a JSON key
   * @param {string} Path The path to the JSON key
   */
  delete(path) {
    if (!path)
      throw new TypeError('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (!isNaN(Number(path.charAt(0))))
      throw new TypeError('Path cannot start with a number');
    path = path.replace(/ /g, '');
    if (!this.get(path))
      return this;
    path = path.split('.');
    path.forEach((p, i) => {
      path[i] = '[\'' + p + '\']';
    });
    path = path.join('.').replace(/\.\[/g, '[');
    const data = this.read();
    try {
      eval(`delete data${path}`);
      this.emit('change', path, this.read(), data);
      fs.writeFileSync(this.FilePath, JSON.stringify  (data, null, Number(this.spaces)));
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  /**
   * Reads the JSON Object from the database file
   */
  read() {
    let data = fs.readFileSync(this.FilePath, 'utf8');
    return data ? JSON.parse(data) : {};
  }
}

function _set(path, value, obj) {
  if (obj === undefined)
    return undefined;
  let locations = path.split('.'),
    output = obj,
    ref = obj;
  for (let i = 0; i < locations.length - 1; i++) {
    if (ref[locations[i]] === undefined)
      ref = ref[locations[i]] = {};
    else ref = ref[locations[i]];
  }
  ref[locations[locations.length - 1]] = value;
  return output;
}
function _get(path, obj = {}) {
  let locations = path.split('.'),
    ref = obj;
  for (let i = 0; i < locations.length - 1; i++) {
    ref = ref[locations[i]] !== undefined ? ref[locations[i]] : undefined;
    if (ref === undefined)
      return undefined;
  }
  return ref[locations[locations.length - 1]];
}

Database.DatabaseOptions = DatabaseOptions;
//Backwards compat with Node 0.10.x
Database.Database = Database;
Database.default = Database;
module.exports = Database;
