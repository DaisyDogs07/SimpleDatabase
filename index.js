'use strict';

const fs = require('fs'),
  path = require('path'),
  {EventEmitter} = require('events');

fs.rmSync = fs.rmSync || fs.unlinkSync;

/**
 * The options for the Database
 * @typedef DatabaseOptions
 * @property {?number} [spaces]
 */

/**
 * The main Database class for creating a database
 */
class Database extends EventEmitter {
  /**
   * Makes a new Database. If the file is not present, We'll make it for you
   * @param {?string} Location The path to the file
   * @param {DatabaseOptions} Options The options to give when creating the database
   */
  constructor(location = 'database', options = {
    spaces: 2
  }) {
    super();
    if (typeof location !== 'string')
      throw new TypeError('Location must be a string');
    if (typeOf(options) !== 'an object')
      throw new TypeError('Options must be an object');
    if (typeof options.spaces !== 'number')
      throw new TypeError('Spaces option must be a number');
    if (options.spaces < 0)
      options.spaces = 0;
    if (options.spaces > 4)
      options.spaces = 4;
    if (location.endsWith('/'))
      location += 'database';
    let loc = location.split('.');
    if (loc.length !== 1 && loc[loc.length - 1] !== 'json')
      throw new Error(`File extension '${loc[loc.length - 1]}' is not supported, Please use the 'json' file extension`);
    if (location.endsWith('.json'))
      location = location.slice(0, -5);
    let dir = location.split('/');
    delete dir[dir.length - 1];
    dir = dir.join('/');
    loc = location.replace(dir, '');
    let filePath = `${path.resolve(dir)}/${loc}.json`;
    if (!fs.existsSync(dir))
      fs.mkdirSync(dir, {
        recursive: true
      });
    if (!fs.existsSync(filePath)) {
      fs.closeSync(fs.openSync(filePath, 'w'));
      fs.writeFileSync(filePath, '{}');
    }
    /**
     * The path to the Database file
     */
    this.filePath = filePath;
    /**
     * The amount of spaces in the Database file
     */
    this.spaces = options.spaces;
    fs.writeFileSync(this.filePath, JSON.stringify(this.read(), null, this.spaces));
    /**
     * The history of all changes
     */
    this.history = [this.read()];
    this.on('change', (path, oldData, newData) => this.history.unshift(newData));
  }
  /**
   * Sets the amount of spaces the file is formatted with
   * @param {?number} Amount The amount of spaces
   */
  setSpaces(amount = 2) {
    amount = Number(amount);
    if (isNaN(amount))
      throw new TypeError(`Spaces cannot be ${typeOf(amount)}`);
    if (amount < 0)
      amount = 0;
    if (amount > 4)
      amount = 4;
    this.spaces = amount;
    fs.writeFileSync(this.filePath, JSON.stringify(this.read(), null, amount));
    return this;
  }
  toString() {
    return fs.readFileSync(this.filePath, 'utf8');
  }
  /**
   * Adds a specified amount to the JSON key
   * @param {string} Path The path to the JSON key
   * @param {?number} Amount The amount to add
   */
  add(path, amount = 1) {
    if (arguments.length === 0)
      throw new Error('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (typeof amount !== 'number')
      throw new TypeError('Amount must be a number');
    if (isNaN(amount))
      throw new TypeError(`Amount connot be ${typeOf(amount)}`);
    let v = this.get(path);
    if (typeof v !== 'number')
      throw new TypeError('Path must lead to a number');
    v += Number(amount);
    return this.set(path, v);
  }
  /**
   * Subtracts a specified amount to the JSON key
   * @param {string} Path The path to the JSON key
   * @param {?number} Amount The amount to subtract
   */
  sub(path, amount = 1) {
    if (arguments.length === 0)
      throw new Error('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (typeof amount !== 'number')
      throw new TypeError('Amount must be a number');
    if (isNaN(amount))
      throw new TypeError(`Amount connot be ${typeOf(amount)}`);
    let v = this.get(path);
    if (typeof v !== 'number')
      throw new TypeError('Path must lead to a number');
    v -= Number(amount);
    return this.set(path, v);
  }
  /**
   * Gets the specified JSON key
   * @param {?string} Path The path to the JSON key
   */
  get(path = '') {
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (!path)
      return this.read();
    return _get(path, this.read());
  }
  /**
   * Sets a JSON key to the new value
   * @param {string} Path the path to the JSON key
   * @param Value The value to set
   */
  set(path, value) {
    if (path === '') {
      if (typeOf(value) !== 'an object')
        throw new TypeError(`Cannot set JSON to ${typeOf(value)}`);
      if (this.toString() !== JSON.stringify(value, null, this.spaces)) {
        this.emit('change', path, this.read(), value);
        fs.writeFileSync(this.filePath, JSON.stringify(value, null, this.spaces));
      }
      return this;
    }
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    try {
      JSON.stringify({
        value
      });
    } catch (e) {
      throw new TypeError(`Value cannot be ${value}`);
    }
    let v = this.get(path);
    if (v !== value) {
      if ((typeOf(v) === 'an object' || typeOf(v) === 'an array') && (typeOf(value) === 'an object' || typeOf(value) === 'an array') && JSON.stringify(v) === JSON.stringify(value))
        return this;
      let data = this.read();
      data = _set(path, value, data);
      this.emit('change', path, this.read(), data);
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, this.spaces));
    }
    return this;
  }
  /**
   * Deletes a JSON key
   * @param {string} Path The path to the JSON key
   */
  delete(path) {
    if (arguments.length === 0)
      throw new Error('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (!this.has(path))
      return this;
    let data = this.read();
    data = _delete(path, data);
    this.emit('change', path, this.read(), data);
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, this.spaces));
    return this;
  }
  /**
   * Finds a JSON key
   * @param {string} Path The scope of where to look
   * @param {Function} fn The function to test with
   */
  find(path, fn) {
    if (arguments.length === 0)
      throw new Error('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    let obj = this.get(path);
    if (typeOf(obj) !== 'an object')
      throw new TypeError('Path must lead to an object');
    if (typeof fn !== 'function')
      throw new TypeError('fn must be a function');
    for (const [k, v] of Object.entries(obj)) {
      if (fn(v, k))
        return v;
    }
    return;
  }
  /**
   * Finds JSON keys
   * @param {string} Path The scope of where to look
   * @param {Function} fn The function to test with
   */
  findAll(path, fn) {
    if (arguments.length === 0)
      throw new Error('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    let obj = this.get(path);
    if (typeOf(obj) !== 'an object')
      throw new TypeError('Path must lead to an object');
    if (typeof fn !== 'function')
      throw new TypeError('fn must be a function');
    let arr = [];
    for (const [k, v] of Object.entries(obj)) {
      if (fn(v, k))
        arr[arr.length] = v;
    }
    if (arr.length !== 0)
      return arr;
    return;
  }
  /**
   * Checks if a JSON key exists
   * @param {string} Path The path to the JSON key
   */
  has(path) {
    if (arguments.length === 0)
      throw new Error('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    return this.get(path) !== undefined;
  }
  /**
   * Reads the JSON Object from the database file
   */
  read() {
    return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
  }
  /**
   * Clears the Database. Use with caution
   */
  clear() {
    if (this.toString() !== '{}')
      this.set('', {});
  }
  /**
   * Moves the Database to a new file
   * @param {string} Location The path to the new file
   * @param {?boolean} DeleteFile Weather to delete the previous file
   */
  moveTo(location, deleteFile = true) {
    if (arguments.length === 0)
      throw new Error('No location provided');
    if (typeof location !== 'string')
      throw new TypeError('Location must be a string');
    if (typeof deleteFile !== 'boolean')
      throw new TypeError('DeleteFile must be boolean');
    const database = new Database(location, {
      spaces: this.spaces
    });
    fs.writeFileSync(database.filePath, JSON.stringify(this.read(), null, this.spaces));
    if (deleteFile)
      fs.rmSync(this.filePath);
    database.history = this.history;
    Object.assign(this, database);
    return this;
  }
  entries() {
    return Object.entries(this.read());
  }
  clone() {
    const database = new Database(this.filePath, {
      spaces: this.spaces
    });
    database.history = this.history;
    return database;
  }
}

function typeOf(value) {
  return (
    typeof value === 'object'
      ? value === null
        ? ''
        : 'an '
      : value === undefined || typeof value === 'boolean'
        ? ''
        : 'a '
    ) + (
      value === null
        ? value
        : value instanceof Array
          ? 'array'
          : typeof value
    );
}
function _delete(path, obj) {
  let locations = path.split('.'),
    ref = obj;
  for (let i = 0; i < locations.length - 1; i++) {
    ref = ref[locations[i]];
  }
  delete ref[locations[locations.length - 1]];
  return obj;
}
function _set(path, value, obj) {
  let locations = path.split('.'),
    ref = obj;
  for (let i = 0; i < locations.length - 1; i++) {
    if (ref[locations[i]] === undefined)
      ref = ref[locations[i]] = {};
    else ref = ref[locations[i]];
  }
  ref[locations[locations.length - 1]] = value;
  return obj;
}
function _get(path, obj) {
  let locations = path.split('.');
  for (let i = 0; i < locations.length; i++) {
    obj = obj[locations[i]];
    if (obj === undefined)
      return;
  }
  return obj;
}

Database.Database = Database;
Database.default = Database;
module.exports = Database;