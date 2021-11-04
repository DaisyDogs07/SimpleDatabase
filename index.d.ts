declare module 'SimpleDatabase' {
  import {EventEmitter} from 'node:events';

  interface DatabaseOptions {
    spaces?: number;
    force?: boolean;
  }

  class Database extends EventEmitter {
    constructor(location?: string, options?: DatabaseOptions);

    public add(path: string, amount?: number): this;
    public sub(path: string, amount?: number): this;
    public set(path: string, value: any): this;
    public set(path: '', value: object): this;
    public delete(path: string): boolean;
    public clear(): void;
    public moveTo(location: string, deleteFile?: boolean): Database;
    public setSpaces(amount?: number): this;

    public find(path: string, fn: (V: any, K: string) => boolean): any;
    public findAll(path: string, fn: (V: any, K: string) => boolean): any[];
    public has(path: string): boolean;
    public get(path: string): any;
    public get(path?: ''): object;
    public entries(): [string, any][];
    public toString(): string;
    public history: object[];
    public filePath: string;
    private read(): object | any[];
    private spaces: number;
    private force: boolean;

    public on(event: string | symbol, listener: (...args: any[]) => void): this;
    public on(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;
    public addListener(event: string | symbol, listener: (...args: any[]) => void): this;
    public addListener(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;

    public off(event: string | symbol, listener: (...args: any[]) => void): this;
    public off(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;
    public removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
    public removeListener(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;

    public once(event: string | symbol, listener: (...args: any[]) => void): this;
    public once(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;

    public emit(event: string | symbol, listener: (...args: any[]) => void): boolean;
    public emit(event: 'change', listener: (path: string, oldData: object, newData: object) => void): boolean;

    public clone(): Database;

    public static Database: typeof Database;
  }
  export = Database;
}