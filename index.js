const fs = require('fs'),
  path = require('path');

class Database {
  /**
   * Makes a new database. If the file is not present, Don't worry! We'll make it for you!
   * @param {string} Location The path to the file. Defaults to "Database/All"
   * @returns {Database} A reference to the Database
   */
  constructor(location = 'Database/All') {
    location = location.split('.');
    if (location[1])
      delete location[1];
    location = location.join('');
    let dir = location.split('/');
    delete dir[dir.length - 1];
    dir = dir.join('/');
    if (typeof location !== 'string')
      throw new TypeError('Location must be a string');
    if (!fs.existsSync(dir))
      fs.mkdirSync(path.resolve(dir), {
        recursive: true
      });
    const filePath = `${path.resolve()}/${location}.json`;
    if (!fs.existsSync(filePath))
      fs.closeSync(fs.openSync(filePath, 'w'));
    /**
     * This indecates the full path to the Database file. WARNING: DO NOT make it relative (./, ../, ect...), It will break
     */
    this.FilePath = filePath;
    /**
     * This indecates the amount spaces in the Database file (Can also make it easier to read)
     */
    this.spaces = 2;
  }
  /**
   * Adds a specified amount to the JSON value
   * @param {string} Path The path to the JSON key (Required)
   * @param {number} Value The amount to add. Defaults to 1
   * @returns {Database} A reference to the Database
   */
  add(path, value = 1) {
    if (!path)
      throw new TypeError('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (typeof value !== 'number')
      throw new TypeError('Value must be a number');
    path = path.replace(/ /g, '').trim();
    let data = this.get(path);
    if (typeof data === 'number')
      data += Number(value);
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
      throw new TypeError('Path must be a string');
    path = path.replace(/ /g, '').trim();
    let data = this.read();
    let result = _get(path, data);
    return result ? result : undefined;
  }
  /**
   * Sets a JSON value to the new value
   * @param {string} Path the path to the JSON key (Required)
   * @param {number} Value The value to set (Required)
   * @returns {Database} A reference to the Database
   */
  set(path, value = '') {
    if (typeof value === 'function')
      throw new TypeError('Value cannot be a function');
    if (!path)
      throw new TypeError('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    path = path.replace(/ /g, '').trim();
    let data = this.read();
    data = _set(path, value, data);
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
      throw new TypeError('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    if (typeof value !== 'number')
      throw new TypeError('Value must be a number');
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
      throw new TypeError('Missing JSON path');
    if (typeof path !== 'string')
      throw new TypeError('Path must be a string');
    path = path.trim().replace(/ /g, '');
    if (!this.get(path))
      return this;
    const data = this.read();
    eval(`delete data.${path}`);
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
    if (!data)
      return {};
    else return JSON.parse(data);
  }
}

function _set(path, value, obj = undefined) {
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

function _get(path, obj = {}) {
  let [locations, ref] = [path.split('.'), obj];
  for (let i = 0; i < locations.length - 1; i++) {
    ref = ref[locations[i]] ? ref[locations[i]] : undefined;
    if (!ref)
      return undefined;
  }
  let output = ref[locations[locations.length - 1]];
  return output;
}

module.exports = Database;