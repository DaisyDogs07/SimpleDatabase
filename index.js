'use strict';

const fs = require('fs'),
  path = require('path');

class Database {
  constructor(location = 'database.json') {
    if (typeof location !== 'string')
      throw new TypeError('Location must be a string');
    if (location.endsWith('/'))
      location += 'database.json';
    location = path.resolve(location);
    let dir = location.split('/');
    dir = dir.join('/');
    if (dir && !fs.existsSync(dir))
      fs.mkdirSync(dir, {
        recursive: true
      });
    if (!fs.existsSync(location))
      fs.writeFileSync(location, '{}');
    else if (fs.statSync(location).isDirectory()) {
      location += '/database.json';
      if (!fs.existsSync(location))
        fs.writeFileSync(location, '{}');
    }
    this.#filePath = location;
  }
  #filePath;
  toString() {
    return fs.readFileSync(this.#filePath, 'utf8');
  }
  add(path, amount = 1) {
    if (typeof amount !== 'number')
      throw new TypeError('Amount must be a number');
    const v = this.get(path);
    if (typeof v !== 'number')
      throw new TypeError('Path must lead to a number. Received: ' + typeOf(v));
    return this.set(path, v + amount);
  }
  sub(path, amount = 1) {
    if (typeof amount !== 'number')
      throw new TypeError('Amount must be a number');
    const v = this.get(path);
    if (typeof v !== 'number')
      throw new TypeError('Path must lead to a number. Received: ' + typeOf(v));
    return this.set(path, v - amount);
  }
  get(path = '') {
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (path === '')
      return this.read();
    return _get(path, this.read());
  }
  set(path, value) {
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    const valStr = JSON.stringify(value);
    if (path === '') {
      if (typeof value !== 'object')
        throw new TypeError('Cannot set JSON to ' + typeOf(value));
      if (this.toString() !== valStr)
        fs.writeFileSync(this.#filePath, valStr);
      return this;
    }
    if (JSON.stringify({value}) === '{}')
      return this;
    const data = JSON.stringify(_set(path, value, this.read()));
    if (this.toString() !== data)
      fs.writeFileSync(this.#filePath, data);
    return this;
  }
  delete(path) {
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (path === '')
      return this.set('', {});
    if (!this.has(path))
      return this;
    const data = _delete(path, this.read());
    fs.writeFileSync(this.#filePath, JSON.stringify(data));
    return this;
  }
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
  has(path) {
    return this.get(path) !== undefined;
  }
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
const { bind, call } = Function.prototype,
  uncurryThis = bind.bind(call),
  hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);
function _delete(path, obj) {
  let locations = path.split('.'),
    key = locations.pop(),
    ref = obj;
  for (const loc of locations) {
    if (!hasOwnProperty(ref, loc))
      return obj;
    ref = ref[loc];
    if (typeof ref !== 'object')
      return obj;
  }
  if (hasOwnProperty(ref, key))
    delete ref[key];
  return obj;
}
function _set(path, value, obj) {
  let locations = path.split('.'),
    key = locations.pop(),
    ref = obj;
  for (const loc of locations) {
    if (!hasOwnProperty(ref, loc) ||
        typeof ref[loc] !== 'object')
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
    if (!hasOwnProperty(obj, loc))
      return;
    obj = obj[loc];
    if (typeof obj !== 'object')
      return;
  }
  if (!hasOwnProperty(obj, key))
    return;
  return obj[key];
}

module.exports = Database;
