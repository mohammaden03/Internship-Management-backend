import { Global, Module } from '@nestjs/common';
import { DiskStorageDriver } from './disk-storage.driver';
import { STORAGE_DRIVER } from './storage-driver.interface';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_DRIVER,
      useClass: DiskStorageDriver,
    },
  ],
  exports: [STORAGE_DRIVER],
})
export class StorageModule {}
