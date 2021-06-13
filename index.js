"use strict";const fs=require("fs"),path=require("path"),{EventEmitter:e}=require("events");class DatabaseOptions{constructor(t=2){this.spaces=Number(t)}}class Database extends e{constructor(t="database",e=new DatabaseOptions){super();if("string"!==typeof t)throw new TypeError("Location must be a string");if("an object"!==typeOf(e))throw new TypeError("Options must be an object");if("number"!==typeof e.spaces)throw new TypeError("Spaces option must be a number");e.spaces<0&&(e.spaces=0);e.spaces>4&&(e.spaces=4);t.endsWith("/")&&(t+="database");let r=t.split(".");if(1!==r.length&&"json"!==r[r.length-1])throw new TypeError(`File extension '${r[r.length-1]}' is not supported, Please use the 'json' file extension`);t.endsWith(".json")&&(t=t.slice(0,-5));let s=t.split("/");delete s[s.length-1];s=s.join("/");r=t.replace(s,"");let i,n=`${path.resolve(s)}/${r}.json`;fs.existsSync(s)||fs.mkdirSync(path.resolve(s),{recursive:!0});fs.existsSync(n)||fs.closeSync(fs.openSync(n,"w"));this.filePath=n;this.spaces=e.spaces;fs.writeFileSync(this.filePath,JSON.stringify(this.read(),null,this.spaces));this.history=[this.read()];Object.defineProperty(this,"onchange",{get:()=>i,set(t){if(t&&"function"!==typeof t)throw new TypeError("Onchange must be a function");return i=t},configurable:!0});this.on("change",(t,e,r)=>{this.history.unshift(r);i&&i(t,e,r)})}setSpaces(t=2){if(!(t=Number(t))&&0!==t||t===1/0||t===-1/0)throw new TypeError(`Spaces cannot be ${"number"===typeof t?t:typeOf(t)}`);t<0&&(t=0),t>4&&(t=4);fs.writeFileSync(this.filePath,JSON.stringify(this.read(),null,t));this.spaces=t;return this}toString(){return fs.readFileSync(this.filePath,"utf8")}add(t,e=1){if(void 0===t)throw new TypeError("Missing JSON path");if("string"!==typeof t)throw new TypeError("Path must be a string");if("number"!==typeof e)throw new TypeError("Amount must be a number");if(!e&&0!==e||e===1/0||e===-1/0)throw new TypeError(`Amount connot be ${"number"===typeof e?e:typeOf(e)}`);let r=this.get(t);if("number"!==typeof r)throw new TypeError("Path must lead to a number");r+=Number(e);return this.set(t,r)}sub(t,e=1){if(void 0===t)throw new TypeError("Missing JSON path");if("string"!==typeof t)throw new TypeError("Path must be a string");if("number"!==typeof e)throw new TypeError("Amount must be a number");if(!e&&0!==e||e===1/0||e===-1/0)throw new TypeError(`Amount connot be ${"number"===typeof e?e:typeOf(e)}`);let r=this.get(t);if("number"!==typeof r)throw new TypeError("Path must lead to a number");r-=Number(e);return this.set(t,r)}get(t=""){if("string"!==typeof t)throw new TypeError("Path must be a string");return t?_get(t,this.read()):this.read()}set(t,e){if(""===t){if("an object"!==typeOf(e))throw new TypeError("Cannot set JSON to "+typeOf(e));this.toString()!==JSON.stringify(e,null,this.spaces)&&(this.emit("change",t,this.read(),e),fs.writeFileSync(this.filePath,JSON.stringify(e,null,this.spaces)));return this}if("string"!==typeof t)throw new TypeError("Path must be a string");if("function"===typeof e)throw new TypeError("Value cannot be a function");let r=this.get(t);if(r!==e){if(!("an object"!==typeOf(r)&&"an array"!==typeOf(r)||"an object"!==typeOf(e)&&"an array"!==typeOf(e)||JSON.stringify(r)!==JSON.stringify(e)))return this;let s=this.read();s=_set(t,e,s);this.emit("change",t,this.read(),s);fs.writeFileSync(this.filePath,JSON.stringify(s,null,this.spaces))}return this}delete(t){if(void 0===t)throw new TypeError("Missing JSON path");if("string"!==typeof t)throw new TypeError("Path must be a string");if(!this.has(t))return this;let e=this.read();e=_delete(t,e);this.emit("change",t,this.read(),e);fs.writeFileSync(this.filePath,JSON.stringify(e,null,this.spaces));return this}find(t,e){if(void 0===t)throw new TypeError("Missing JSON path");if("string"!==typeof t)throw new TypeError("Path must be a string");let r=this.get(t);if("an object"!==typeOf(r))throw new TypeError("Path must lead to an object");if("function"!==typeof e)throw new TypeError("fn must be a function");for(const[t,s]of Object.entries(r))if(e(s,t))return s}findAll(t,e){if(void 0===t)throw new TypeError("Missing JSON path");if("string"!==typeof t)throw new TypeError("Path must be a string");let r=this.get(t);if("an object"!==typeOf(r))throw new TypeError("Path must lead to an object");if("function"!==typeof e)throw new TypeError("fn must be a function");let s=[];for(const[t,i]of Object.entries(r))e(i,t)&&(s[s.length]=i);if(0!==s.length)return s}has(t){if(!t)throw new TypeError("Missing JSON path");if("string"!==typeof t)throw new TypeError("Path must be a string");return void 0!==this.get(t)}read(){let t=fs.readFileSync(this.filePath,"utf8");try{t=JSON.parse(t)}catch(e){t={}}return new Object(t)}clear(){"{}"!==this.toString()&&(this.emit("change",null,this.read(),{}),fs.writeFileSync(this.filePath,"{}"))}moveTo(t,e=!0){if(void 0===t)throw new TypeError("No location provided");if("string"!==typeof t)throw new TypeError("Location must be a string");if("boolean"!==typeof e)throw new TypeError("DeleteFile must be boolean");const r=new Database(t,{spaces:this.spaces});fs.writeFileSync(r.filePath,JSON.stringify(this.read(),null,this.spaces));e&&fs.unlinkSync(this.filePath);r.history=this.history;Object.assign(this,r);return this}entries(){return Object.entries(this.read())}toJSON(){return this.read()}clone(){const t=new Database(this.filePath,{spaces:this.spaces});t.history=new Array(this.history);return t}}function typeOf(t){return("object"===typeof t?null===t?"":"an ":void 0===t||"boolean"===typeof t?"":"a ")+(null===t?t:t instanceof Array?"array":typeof t)}function _delete(t,e){let r=t.split("."),s=e;for(let t=0;t<r.length-1;t++)s=s[r[t]];delete s[r[r.length-1]];return e}function _set(t,e,r){let s=t.split("."),i=r;for(let t=0;t<s.length-1;t++)i=void 0===i[s[t]]?i[s[t]]={}:i[s[t]];i[s[s.length-1]]=e;return r}function _get(t,e){let r=t.split(".");for(let t=0;t<r.length;t++)if(void 0===(e=e[r[t]]))return;return e}module.exports=Database;Object.assign(module.exports,{Database,DatabaseOptions,default:Database});
