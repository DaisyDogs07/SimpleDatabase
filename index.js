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
   * @param {?string} Location The path to the file
   * @param {DatabaseOptions | object} Options The options to give when creating the database
   */
  constructor(location = 'database', options = new DatabaseOptions) {
    super();
    if (typeof location !== 'string')
      throw new TypeError('Location must be a string');
    if (location.startsWith('./') || location.startsWith('../'))
      throw new TypeError('Relative paths are not supported');
    if (typeof options !== 'object')
      throw new TypeError('Options must be an object');
    if (typeof options.spaces !== 'number')
      throw new TypeError('Spaces option must be a number');
    if (options.spaces > 4)
      options.spaces = 4;
    let loc = location.split('.');
    if (loc.length !== 1 && loc[loc.length - 1] !== 'json')
      throw new TypeError(`File extension '${loc[loc.length - 1]}' is not supported, Please use the 'json' file extension`);
    if (location.endsWith('.json'))
      location = location.slice(0, -5);
    let dir = location.split('/');
    delete dir[dir.length - 1];
    dir = dir.join('/');
    loc = location.replace(dir, '');
    let filePath = `${path.resolve(dir)}/${loc}.json`;
    if (!fs.existsSync(dir))
      fs.mkdirSync(path.resolve(dir), {
        recursive: true
      });
    if (!fs.existsSync(filePath))
      fs.closeSync(fs.openSync(filePath, 'w'));
    Object.assign(this, {
      get FilePath() {
        return filePath;
      },
      /**
       * The amount of spaces in the Database file. Setting this value will update the Database file
       */
      get spaces() {
        return options.spaces;
      },
      set spaces(num) {
        if (!Number(num) && Number(num) !== 0)
          throw new TypeError("Cannot set property 'spaces' to " + typeOf(num));
        if (num > 4)
          num = 4;
        let data = this.read();
        fs.writeFileSync(this.FilePath, JSON.stringify(this.read(), null, Number(num)));
        this.emit('change', null, this.read(), data);
        options.spaces = Number(num);
        return Number(num);
      }
    });
    fs.writeFileSync(filePath, JSON.stringify(this.read(), null, Number(this.spaces)));
  }
  toString() {
    return fs.readFileSync(this.FilePath, 'utf8');
  }
  /**
   * Adds a specified amount to the JSON key
   * @param {string} Path The path to the JSON key
   * @param {number | Promise<number>} Amount The amount to add
   */
  add(path, amount = 1) {
    if (!path)
      throw new TypeError('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (amount instanceof Promise)
      return amount.then(v => this.add(path, v));
    if (typeof amount !== 'number')
      throw new TypeError('Amount must be a number');
    if (typeof data !== 'number')
      throw new TypeError('Path must lead to a number');
    let v = this.get(path);
    v += Number(amount);
    return this.set(path, v);
  }
  /**
   * Subtracts a specified amount to the JSON key
   * @param {string} Path The path to the JSON key
   * @param {number | Promise<number>} Amount The amount to subtract
   */
  sub(path, amount = 1) {
    if (!path)
      throw new TypeError('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (amount instanceof Promise)
      return amount.then(v => this.sub(path, v));
    if (typeof amount !== 'number')
      throw new TypeError('Amount must be a number');
    let v = this.get(path);
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
   * @param {any | Promise<any>} Value The value to set
   */
  set(path, value) {
    if (path === '') {
      if (value instanceof Promise)
        return value.then(v => this.set(path, v));
      if (typeof value !== 'object' || value === null)
        throw new TypeError('Cannot set JSON to ' + typeOf(value));
      this.emit('change', path, this.read(), value);
      fs.writeFileSync(this.FilePath, JSON.stringify(value, null, this.spaces));
      return this;
    }
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (value instanceof Promise)
      return value.then(v => this.set(path, v));
    if (value === undefined)
      throw new TypeError("Value cannot be 'undefined'");
    if (typeof value === 'function')
      value = value.toString();
    if (this.get(path) !== value) {
      let data = this.read();
      data = _set(path, value, data);
      this.emit('change', path, this.read(), data);
      fs.writeFileSync(this.FilePath, JSON.stringify(data, null, this.spaces));
    }
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
    if (this.get(path) === undefined)
      return true;
    let p = path;
    path = path.split('.');
    path.forEach((v, i) => {
      path[i] = "['" + v + "']";
    });
    path = path.join('');
    const data = this.read();
    try {
      eval(`delete data${path}`);
      this.emit('change', p, this.read(), data);
      fs.writeFileSync(this.FilePath, JSON.stringify(data, null, this.spaces));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  /**
   * Finds a JSON key
   * @param {string} Path The scope of where to look
   * @param {Function} fn The function to test with
   * @param {*} thisArg The value to use as 'this' when executing fn
   */
   find(path, fn, thisArg) {
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (typeof fn !== 'function')
      throw new TypeError('fn must be a function');
    if (thisArg !== undefined && thisArg !== null)
      fn = fn.bind(thisArg);
    let obj = this.get(path);
    if (typeOf(obj) !== 'an object')
      throw new TypeError('Path must lead to an object');
    for (const [k, v] of Object.entries(obj)) {
      if (fn(v, k))
        return v;
    }
    return undefined;
  }
  /**
   * Same as find() except it returns an array
   * @param {string} Path The scope of where to look
   * @param {Function} fn The function to test with
   * @param {*} thisArg The value to use as 'this' when executing fn
   */
  findAll(path, fn, thisArg) {
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (typeof fn !== 'function')
      throw new TypeError('fn must be a function');
    if (thisArg !== undefined && thisArg !== null)
      fn = fn.bind(thisArg);
    let obj = this.get(path);
    if (typeof obj !== 'object' || obj === null)
      throw new TypeError('Path must lead to an object');
      arr = [];
    for (const [k, v] of Object.entries(obj)) {
      if (fn(v, k))
        arr[arr.length] = v;
    }
    return arr.length === 0
      ? undefined
      : arr;
  }
  /**
   * Reads the JSON Object from the database file
   */
  read() {
    let data = fs.readFileSync(this.FilePath, 'utf8');
    return data ? JSON.parse(data) : {};
  }
  /**
   * Clears the Database file. Use with caution
   */
  clear() {
    if (this.toString() !== '{}') {
      this.emit('change', null, this.read(), {});
      fs.writeFileSync(this.FilePath, '{}');
    }
  }
  /**
   * Moves the Database to a new file
   */
  moveTo(location, deleteFile = true) {
    if (!location)
      throw new TypeError('No location provided');
    if (typeof deleteFile !== 'boolean')
      throw new TypeError('DeleteFile must be boolean');
    const database = new Database(location, {
      spaces: this.spaces
    });
    fs.writeFileSync(database.FilePath, JSON.stringify(this.read(), null, this.spaces));
    if (deleteFile)
      fs.unlinkSync(this.FilePath);
    return Object.assign(this, database);
  }
  static get Database() {
    return Database;
  }
  static get DatabaseOptions() {
    return DatabaseOptions;
  }
  static get default() {
    return Database;
  }
}

function typeOf(value) {
  return (
    typeof value === 'object'
      ? value === null
        ? ''
        : 'an '
      : typeof value === 'undefined'
        ? ''
        : 'a '
    ) + (
      value === null
        ? 'null'
        : typeof value
    );
}
function _set(path, value, obj) {
  if (!obj)
    return;
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
function _get(path, obj) {
  let locations = path.split('.'),
    ref = obj;
  for (let i = 0; i < locations.length - 1; i++) {
    ref = ref[locations[i]];
    if (ref === undefined)
      return;
  }
  return ref[locations[locations.length - 1]];
}

module.exports = Database;
