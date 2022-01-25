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
   */
  constructor(location = 'database.json') {
    super();
    if (typeof location !== 'string')
      throw new TypeError('Location must be a string');
    if (!location || location.endsWith('/'))
      location += 'database.json';
    if (!location.endsWith('.json'))
      location += '.json';
    let dir = location.split('/');
    const loc = dir.pop();
    dir = dir.join('/');
    const filePath = `${path.resolve(dir)}/${loc}`;
    if (dir && !fs.existsSync(dir))
      fs.mkdirSync(dir);
    if (!fs.existsSync(filePath))
      fs.writeFileSync(filePath, '{}');
    this.#filePath = filePath;
  }
  #filePath;
  toString() {
    return fs.readFileSync(this.#filePath, 'utf8');
  }
  /**
   * Adds a specified amount to the JSON key
   */
  add(path, amount = 1) {
    if (typeof amount !== 'number')
      throw new TypeError('Amount must be a number');
    let v = this.get(path);
    if (typeof v !== 'number')
      throw new TypeError('Path must lead to a number. Received: ' + typeOf(v));
    return this.set(path, v + amount);
  }
  /**
   * Subtracts a specified amount to the JSON key
   * @param {string} Path The path to the JSON key
   * @param {?number} Amount The amount to subtract
   */
  sub(path, amount = 1) {
    if (typeof amount !== 'number')
      throw new TypeError('Amount must be a number');
    let v = this.get(path);
    if (typeof v !== 'number')
      throw new TypeError('Path must lead to a number. Received: ' + typeOf(v));
    return this.set(path, v - amount);
  }
  /**
   * Gets the specified JSON key
   * @param {?string} Path The path to the JSON key
   */
  get(path = '') {
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (path === '')
      return this.read();
    return _get(path, this.read());
  }
  /**
   * Sets a JSON key to the new value
   * @param {string} Path the path to the JSON key
   * @param Value The value to set
   */
  set(path, value) {
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    const valStr = JSON.stringify(value);
    if (path === '') {
      if (typeof value !== 'object')
        throw new TypeError('Cannot set JSON to ' + typeOf(value));
      if (this.toString() !== valStr) {
        this.emit('change', path, this.read(), JSON.parse(valStr));
        fs.writeFileSync(this.#filePath, valStr);
      }
      return this;
    }
    if (JSON.stringify({value}) === '{}')
      return this;
    const data = JSON.stringify(_set(path, value, this.read()));
    if (this.toString() !== data) {
      this.emit('change', path, this.read(), JSON.parse(data));
      fs.writeFileSync(this.#filePath, data);
    }
    return this;
  }
  /**
   * Deletes a JSON key
   * @param {string} Path The path to the JSON key
   */
  delete(path) {
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (path === '')
      return this.set('', {});
    if (!this.has(path))
      return this;
    const data = _delete(path, this.read());
    this.emit('change', path, this.read(), data);
    fs.writeFileSync(this.#filePath, JSON.stringify(data));
    return this;
  }
  /**
   * Finds a JSON value
   * @param {string} Path The scope of where to look
   * @param {Function} fn The function to test with
   */
  find(path, fn) {
    const obj = this.get(path);
    if (typeof obj !== 'object')
      throw new TypeError('Path must lead to an object');
    if (typeof fn !== 'function')
      throw new TypeError('fn must be a function');
    for (const [k, v] of Object.entries(obj))
      if (fn(v, k))
        return v;
  }
  /**
   * Finds JSON values
   * @param {string} Path The scope of where to look
   * @param {Function} fn The function to test with
   */
  findAll(path, fn) {
    const obj = this.get(path);
    if (typeof obj !== 'object')
      throw new TypeError('Path must lead to an object');
    if (typeof fn !== 'function')
      throw new TypeError('fn must be a function');
    const arr = [];
    for (const [k, v] of Object.entries(obj))
      if (fn(v, k))
        arr[arr.length] = v;
    if (arr.length !== 0)
      return arr;
  }
  /**
   * Checks if a JSON key exists
   * @param {string} Path The path to the JSON key
   */
  has(path) {
    return this.get(path) !== undefined;
  }
  /**
   * Reads the JSON Object from the database file
   */
  read() {
    return JSON.parse(this.toString());
  }
  clone() {
    return new Database(this.#filePath);
  }
}

function typeOf(value) {
  const type = typeof value;
  return (
    type === 'object'
      ? value === null
        ? ''
        : 'an '
      : value === undefined || type === 'boolean'
        ? ''
        : 'a '
    ) + (
      value === null
        ? value
        : Array.isArray(value)
          ? 'array'
          : type
    );
}
function _delete(path, obj) {
  let locations = path.split('.'),
    key = locations.pop(),
    ref = obj;
  for (const loc of locations) {
    ref = ref[loc];
    if (typeof ref !== 'object')
      return obj;
  }
  delete ref[key];
  return obj;
}
function _set(path, value, obj) {
  let locations = path.split('.'),
    key = locations.pop(),
    ref = obj;
  for (const loc of locations) {
    if (typeof ref[loc] !== 'object')
      ref = ref[loc] = {};
    else ref = ref[loc];
  }
  ref[key] = value;
  return obj;
}
function _get(path, obj) {
  const locations = path.split('.'),
    key = locations.pop();
  for (const loc of locations) {
    obj = obj[loc];
    if (typeof obj !== 'object')
      return;
  }
  return obj[key];
}

module.exports = Database;