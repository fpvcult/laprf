export interface IndexOf<T> {
  [key: string]: T;
  [index: number]: T;
}

export class Index<T> {
  private indexes: IndexOf<T> = {};

  set(signature: number, name: string, item: T) {
    this.indexes[signature] = item;
    this.indexes[name] = item;
  }

  get(key: string | number): T | undefined {
    return this.indexes[key];
  }
}
