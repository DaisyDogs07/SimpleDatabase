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
    if (typeOf(options) !== 'an object')
      throw new TypeError('Options must be an object');
    if (typeof options.spaces !== 'number')
      throw new TypeError('Spaces option must be a number');
    if (options.spaces < 0)
      options.spaces = 0;
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
    /**
     * The path to the Database file
     */
    this.filePath = filePath;
    /**
     * The amount of spaces in the Database file
     */
    this.spaces = options.spaces;
    fs.writeFileSync(filePath, JSON.stringify(this.read(), null, Number(this.spaces)));
    this.history = [this.read()];
    this.on('change', (path, oldData, newData) => {
      this.history.unshift(newData);
    });
  }
  /**
   * Sets the amount of spaces the file is formatted with
   * @param {?number} Num The amount of spaces
   */
  setSpaces(num = 2) {
    num = Number(num);
    if (!num && num !== 0)
      throw new TypeError("Cannot set property 'spaces' to " + typeOf(num));
    if (num < 0)
      num = 0;
    if (num > 4)
      num = 4;
    fs.writeFileSync(this.filePath, JSON.stringify(this.read(), null, num));
    this.spaces = num;
    return num;
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
    if (!path)
      throw new TypeError('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (typeof amount !== 'number')
      throw new TypeError('Amount must be a number');
    if (amount === Infinity)
      throw new TypeError('Amount connot be Infinity');
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
    if (!path)
      throw new TypeError('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (typeof amount !== 'number')
      throw new TypeError('Amount must be a number');
    if (amount === Infinity)
      throw new TypeError('Amount connot be Infinity');
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
   * @param {any} Value The value to set
   */
  set(path, value) {
    if (path === '') {
      if (typeof value !== 'object' || value === null)
        throw new TypeError('Cannot set JSON to ' + typeOf(value));
      this.emit('change', path, this.read(), value);
      fs.writeFileSync(this.filePath, JSON.stringify(value, null, this.spaces));
      return this;
    }
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (value === undefined)
      return this;
    if (typeof value === 'function')
      value = value.toString();
    if (this.get(path) !== value) {
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
      let removed = eval(`delete data${path}`);
      if (!removed)
        return false;
      this.emit('change', p, this.read(), data);
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, this.spaces));
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
   */
   find(path, fn) {
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (typeof fn !== 'function')
      throw new TypeError('fn must be a function');
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
   */
  findAll(path, fn) {
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (typeof fn !== 'function')
      throw new TypeError('fn must be a function');
    let obj = this.get(path);
    if (typeof obj !== 'object' || obj === null)
      throw new TypeError('Path must lead to an object');
    let arr = [];
    for (const [k, v] of Object.entries(obj)) {
      if (fn(v, k))
        arr[arr.length] = v;
    }
    return arr.length === 0
      ? undefined
      : arr;
  }
  /**
   * Checks if a key is present in the Database
   * @param {string} Path The path to the JSON key
   */
  has(path) {
    if (!path)
      throw new TypeError('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    return this.get(path) !== undefined;
  }
  /**
   * Reads the JSON Object from the database file
   */
  read() {
    let data = fs.readFileSync(this.filePath, 'utf8');
    return data ? JSON.parse(data) : {};
  }
  /**
   * Clears the Database file. Use with caution
   */
  clear() {
    if (this.toString() !== '{}') {
      this.emit('change', null, this.read(), {});
      fs.writeFileSync(this.filePath, '{}');
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
    fs.writeFileSync(database.filePath, JSON.stringify(this.read(), null, this.spaces));
    if (deleteFile)
      fs.unlinkSync(this.filePath);
    database.history = this.history;
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
