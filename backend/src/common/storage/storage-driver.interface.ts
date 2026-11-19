export const STORAGE_DRIVER = Symbol('STORAGE_DRIVER');

export interface StoredObject {
  storageKey: string;
  size: number;
}

export interface StorageDriver {
  save(storageKey: string, buffer: Buffer): Promise<StoredObject>;
  exists(storageKey: string): Promise<boolean>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}
