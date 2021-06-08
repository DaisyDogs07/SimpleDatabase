declare module 'SimpleDatabase' {
  import {EventEmitter} from 'events';
  export class DatabaseOptions {
    constructor(spaces?: number);
    public spaces?: number;
  }
  export class Database extends EventEmitter {
    constructor(location?: string, options?: DatabaseOptions);
    //Modifiers
    public add(path: string, amount?: number): this;
    public sub(path: string, amount?: number): this;
    public set(path: string, value: any): this;
    public set(path: '', value: object): this;
    public get(path?: string): object;
    public get(path: string): any;
    public delete(path: string): boolean;
    public clear(): void;
    public moveTo(location: string, deleteFile?: boolean): this;
    public setSpaces(amount?: number): this;

    //Readers
    public find<V, K>(path: string, fn: (V: any, K: string) => boolean): V;
    public findAll<V, K>(path: string, fn: (V: any, K: string) => boolean): V[];
    private read(): object;
    public has(path: string): boolean;
    public entries(): [string, any][];
    public toJSON(): object;
    public toString(): string;
    private spaces: number;
    public history: object[];

    //Events
    public on(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;
    public off(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;
    public once(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;
    public emit(event: 'change', listener: (path: string, oldData: object, newData: object) => void): boolean;

    //Utils
    public clone(): this;
    public static DatabaseOptions: typeof DatabaseOptions;
    public static default: typeof Database;
    public static Database: typeof Database;
  }
  export = Database;
}
