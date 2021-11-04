'use strict';

const fs = require('fs'),
  path = require('path'),
  {EventEmitter} = require('events');

/**
 * The main Database class for creating a database
 */
class Database extends EventEmitter {
  /**
   * Makes a new Database. If the file is not present, We'll make it for you
   * @param {?string} Location The path to the file
   * @param {?object} Options The options to give when creating the database
   */
  constructor(location = 'database.json', options = {}) {
    super();
    if (typeof location !== 'string')
      throw new TypeError('Location must be a string');
    if (typeOf(options) !== 'an object')
      throw new TypeError('Options must be an object');
    options = Object.assign({
      spaces: 2,
      force: false
    }, options);
    if (typeof options.spaces !== 'number')
      throw new TypeError('Spaces option must be a number');
    if (typeof options.force !== 'boolean')
      throw new TypeError('Force option must be boolean');
    if (!location || location.endsWith('/'))
      location += 'database.json';
    if (!options.force) {
      if (!location.split('/').pop().includes('.'))
        location += '.json';
    }
    let loc = location.replace(/\.(\.)?\//g, '').split('.');
    if (!options.force && loc.length !== 1 && !['json', 'sql'].includes(loc[loc.length - 1]))
      throw new Error(`File extension '${loc[loc.length - 1]}' is not supported, Please use the 'json' or 'sql' file extension`);
    let dir = location.split('/');
    loc = dir.pop();
    dir = dir.join('/');
    let filePath = `${path.resolve(dir)}/${loc}`;
    if (!fs.existsSync(dir || './'))
      fs.mkdirSync(dir, {
        recursive: true
      });
    if (!fs.existsSync(filePath)) {
      fs.closeSync(fs.openSync(filePath, 'w'));
      fs.writeFileSync(filePath, '{}');
    }
    Object.defineProperties(this, {
      filePath: {
        value: filePath,
        enumerable: true,
        writable: true
      },
      spaces: {
        value: Math.min(Math.max(options.spaces, 0), 4), // Confine options.spaces between 0 and 4 (Faster than using ifs)
        writable: true
      },
      force: {
        value: options.force
      }
    });
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
      throw new TypeError('Spaces cannot be ' + typeOf(amount));
    amount = Math.min(Math.max(amount, 0), 4);
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
      throw new TypeError(`Path must lead to a number. Received: ${typeOf(v)}`);
    v += amount;
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
      throw new TypeError(`Path must lead to a number. Received: ${typeOf(v)}`);
    v -= amount;
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
    if (arguments.length === 0)
      throw new Error('Missing JSON path');
    if (path === '') {
      if (typeOf(value) !== 'an object' && typeOf(value) !== 'an array')
        throw new TypeError(`Cannot set JSON to ${typeOf(value)}`);
      if (this.toString() !== JSON.stringify(value, null, this.spaces)) {
        this.emit('change', path, this.read(), JSON.parse(JSON.stringify(value)));
        fs.writeFileSync(this.filePath, JSON.stringify(value, null, this.spaces));
      }
      return this;
    }
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (JSON.stringify({
      value
    }) === '{}')
      throw new TypeError(`Value cannot be ${typeof value === 'number' ? value : typeOf(value)}`);
    let v = this.get(path);
    if (v !== value) {
      if ((typeOf(v) === 'an object' || typeOf(v) === 'an array') &&
          (typeOf(value) === 'an object' || typeOf(value) === 'an array') &&
          JSON.stringify(v) === JSON.stringify(value))
        return this;
      let data = this.read();
      data = _set(path, value, data);
      if (JSON.stringify(this.read()) === JSON.stringify(data)) // Returns true in some cases like NaN and Infinity values
        return this;
      this.emit('change', path, this.read(), JSON.parse(JSON.stringify(data)));
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
    this.emit('change', path, this.read(), JSON.parse(JSON.stringify(data)));
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
      spaces: this.spaces,
      force: this.force
    });
    fs.writeFileSync(database.filePath, JSON.stringify(this.read(), null, this.spaces));
    if (deleteFile)
      fs.unlinkSync(this.filePath);
    database.history = this.history;
    return this;
  }
  entries() {
    return Object.entries(this.read());
  }
  clone() {
    const database = new Database(this.filePath, {
      spaces: this.spaces,
      force: this.force
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
module.exports = Database;