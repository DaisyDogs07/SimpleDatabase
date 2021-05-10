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
  constructor(location = 'database.json', options = new DatabaseOptions) {
    super();
    if (typeof location !== 'string')
      throw new TypeError('Location must be a string');
    if (location.startsWith('/') || location.startsWith('./') || location.startsWith('../'))
      throw new TypeError('Absolute and relative paths are not supported yet');
    if (typeof options !== 'object')
      throw new TypeError('Options must be an object');
    if (typeof options.spaces !== 'number')
      throw new TypeError('Spaces option must be a number');
    if (options.spaces > 4)
      options.spaces = 4;
    let loc = location.split('.');
    if (loc.length !== 1 && loc[loc.length - 1] && loc[loc.length - 1] !== 'json')
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
       * This indicates the amount of spaces in the Database file. Setting this value will update the Database file
       */
      get spaces() {
        return options.spaces;
      },
      set spaces(num) {
        if (!Number(num) && Number(num) !== 0)
          throw new TypeError("Cannot set property 'spaces' to " + (function(){return typeof num==='object'?num===null?'':'an ':typeof num==='undefined'?'':'a '}()) + (function(){return num===null?'null':typeof num}()));
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
  toJSON() {
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
    if (value === undefined)
      throw new TypeError("Value cannot be 'undefined'");
    if (typeof value === 'function')
      value = value.toString();
    let data = this.read();
    data = _set(path, value, data);
    this.emit('change', path, this.read(), data);
    fs.truncateSync(this.FilePath);
    fs.writeFileSync(this.FilePath, JSON.stringify(data, null, this.spaces));
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
    if (!this.get(path))
      return true;
    path = path.split('.');
    path.forEach((p, i) => {
      path[i] = "['" + p + "']";
    });
    path = path.join('');
    const data = this.read();
    try {
      eval(`delete data${path}`);
      this.emit('change', path, this.read(), data);
      fs.writeFileSync(this.FilePath, JSON.stringify(data, null, this.spaces));
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
  /**
   * Moves the Database to a new file
   */
  moveTo(location, deleteFile = true) {
    if (!location)
      throw new TypeError(`Cannot move database to ${location}`);
    if (typeof deleteFile !== 'boolean')
      throw new TypeError('DeleteFile must be boolean');
    const database = new Database(location, {
      spaces: this.spaces
    });
    fs.writeFileSync(database.FilePath, JSON.stringify(this.read(), null, this.spaces));
    if (deleteFile)
      fs.unlinkSync(this.FilePath);
    Object.assign(this, database);
    return this;
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
function _get(path, obj = {}) {
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
