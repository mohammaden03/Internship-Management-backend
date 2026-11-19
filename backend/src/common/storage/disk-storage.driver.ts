import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { readFile, unlink, writeFile } from 'fs/promises';
import { basename, isAbsolute, join, resolve } from 'path';
import { StorageDriver, StoredObject } from './storage-driver.interface';

@Injectable()
export class DiskStorageDriver implements StorageDriver {
  private getRootDir(): string {
    const configured = process.env.UPLOAD_DESTINATION || './uploads/documents';
    const root = isAbsolute(configured) ? configured : resolve(process.cwd(), configured);
    if (!existsSync(root)) {
      mkdirSync(root, { recursive: true });
    }
    return root;
  }

  private resolveSafePath(storageKey: string): string {
    // Strip any path traversal attempts
    const safeName = basename(storageKey);
    return join(this.getRootDir(), safeName);
  }

  async save(storageKey: string, buffer: Buffer): Promise<StoredObject> {
    const targetPath = this.resolveSafePath(storageKey);
    await writeFile(targetPath, buffer);
    return {
      storageKey: basename(storageKey),
      size: buffer.length,
    };
  }

  async exists(storageKey: string): Promise<boolean> {
    return existsSync(this.resolveSafePath(storageKey));
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(this.resolveSafePath(storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    const targetPath = this.resolveSafePath(storageKey);
    if (existsSync(targetPath)) {
      await unlink(targetPath);
    }
  }
}
