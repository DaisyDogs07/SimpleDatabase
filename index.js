const fs = require('fs'),
  path = require('path'),
  {
    EventEmitter
  } = require('events');

function newErr(database, message) {
  if (database.listeners('err').length !== 0)
    return database.emit('err', message);
  const err = new TypeError(message);
  throw err;
}

class Database extends EventEmitter {
  /**
   * Makes a new database. If the file is not present, Don't worry! We'll make it for you!
   * @param {string} Location The path to the file. Defaults to "Database/All"
   * @param {object} Options The options to give when creating the database
   * @returns {Database} A reference to the Database
   */
  constructor(location = 'Database/All', options = {
    spaces: 2
  }) {
    super();
    if (typeof location !== 'string')
      return newErr(this, 'Location must be a string');
    if (typeof options !== 'object')
      return newErr(this, 'Options must be an object');
    if (typeof options.spaces !== 'number')
      return newErr(this, 'Spaces option must be a number');
    let loc = location.replace(/(..\/)|(.\/)/g, '').split('.');
    if (loc.length !== 1)
      if (loc[loc.length - 1] && loc[loc.length - 1] !== 'json')
        return newErr(this, `File extension '${loc[loc.length - 1]}' is not supported, Please use the 'json' file extension`);
    if (location.endsWith('.json'))
      location = location.slice(0, -5);
    let dir = location.split('/');
    delete dir[dir.length - 1];
    dir = dir.join('/');
    location = location.replace(dir, '');
    if (!fs.existsSync(dir))
      fs.mkdirSync(path.resolve(dir), {
        recursive: true
      });
    const filePath = `${path.resolve(dir)}/${location}.json`;
    console.log(filePath);
    if (!fs.existsSync(filePath))
      fs.closeSync(fs.openSync(filePath, 'w'));
    /**
     * This indecates the full path to the database file
     */
    this.FilePath = filePath;
    /**
     * This indecates the amount spaces in the database file (Can also make it easier to read)
     */
    this.spaces = options.spaces;
  }
  /**
   * Adds a specified amount to the JSON value
   * @param {string} Path The path to the JSON key (Required)
   * @param {number} Value The amount to add. Defaults to 1
   * @returns {Database} A reference to the Database
   */
  add(path, value = 1) {
    if (!path)
      return newErr(this, 'Missing JSON path');
    if (typeof path !== 'string')
      return newErr(this, 'Path must be a string');
    if (!isNaN(Number(path.charAt(0))))
      return newErr(this, 'Path cannot start with a number');
    if (typeof value !== 'number')
      return newErr(this, 'Value must be a number');
    path = path.replace(/ /g, '').trim();
    let data = this.get(path);
    if (typeof data === 'number')
      data += Number(value)
    else data = Number(value);
    this.set(path, data);
    return this;
  }
  /**
   * Gets the specified JSON key's value
   * @param {string} Path The path to the JSON key
   * @returns {string | number | object} The JSON value of the JSON key
   */
  get(path) {
    if (!path)
      return this.read();
    if (typeof path !== 'string')
      return newErr(this, 'Path must be a string');
    if (!isNaN(Number(path.charAt(0))))
      return newErr(this, 'Path cannot start with a number');
    path = path.replace(/ /g, '').trim();
    let result = this._get(path, this.read());
    return result ? result : undefined;
  }
  /**
   * Sets a JSON value to the new value
   * @param {string} Path the path to the JSON key (Required)
   * @param {number} Value The value to set (Required)
   * @returns {Database} A reference to the Database
   */
  set(path, value = '') {
    if (!path)
      return newErr(this, 'Missing JSON path');
    if (typeof path !== 'string')
      return newErr(this, 'Path must be a string');
    if (!isNaN(Number(path.charAt(0))))
      return newErr(this, 'Path cannot start with a number');
    if (typeof value === 'function')
      return newErr(this, 'Value cannot be a function');
    path = path.replace(/ /g, '').trim();
    let data = this._set(path, value, this.read());
    if (eval(`this.read().${path}`) === value)
      return this;
    this.emit('change', path, this.read(), data);
    fs.truncateSync(this.FilePath);
    fs.writeFileSync(this.FilePath, JSON.stringify(data, null, this.spaces), {
      encoding: 'utf-8'
    });
    return this;
  }
  /**
   * Subtracts a specified amount to the JSON value
   * @param {string} Path The path to the JSON key (Required)
   * @param {number} Value The amount to subtract. Defaults to 1
   * @returns {Database} A reference to the Database
   */
  sub(path, value = 1) {
    if (!path)
      return newErr(this, 'Missing JSON path');
    if (typeof path !== 'string')
      return newErr(this, 'Path must be a string');
    if (!isNaN(Number(path.charAt(0))))
      return newErr(this, 'Path cannot start with a number');
    if (typeof value !== 'number')
      return newErr(this, 'Value must be a number');
    path = path.replace(/ /g, '').trim();
    let data = this.get(path);
    if (typeof data === 'number')
      data -= Number(value);
    else data = Number(value);
    this.set(path, data);
    return this;
  }
  /**
   * Deletes a JSON key
   * @param {string} Path The path to the JSON key (Required)
   * @returns {Database} A reference to the Database
   */
  delete(path) {
    if (!path)
      return newErr(this, 'Missing JSON path');
    if (typeof path !== 'string')
      return newErr(this, 'Path must be a string');
    if (!isNaN(Number(path.charAt(0))))
      return newErr(this, 'Path cannot start with a number');
    path = path.trim().replace(/ /g, '');
    if (!this.get(path))
      return this;
    const data = this.read();
    eval(`delete data.${path}`);
    this.emit('change', path, this.read(), data);
    fs.writeFileSync(this.FilePath, JSON.stringify(data, null, this.spaces), {
      encoding: 'utf-8'
    });
    return this;
  }
  /**
   * Reads the JSON Object from the database file
   * @returns {Object} The JSON object
   */
  read() {
    let data = fs.readFileSync(this.FilePath, 'utf-8');
    return data ? JSON.parse(data) : {};
  }
  _set(path, value, obj = undefined) {
    if (obj === undefined)
      return undefined;
    let locations = path.split('.'),
      output = obj,
      ref = obj;
    for (let i = 0; i < locations.length - 1; i++) {
      if (!ref[locations[i]])
        ref = ref[locations[i]] = {};
      else ref = ref[locations[i]];
    }
    ref[locations[locations.length - 1]] = value;
    return output;
  }
  _get(path, obj = {}) {
    let locations = path.split('.'),
      ref = obj;
    for (let i = 0; i < locations.length - 1; i++) {
      ref = ref[locations[i]] ? ref[locations[i]] : undefined;
      if (!ref)
        return undefined;
    }
    return ref[locations[locations.length - 1]];
  }
}

module.exports = Database;
