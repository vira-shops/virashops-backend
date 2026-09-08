import { Injectable } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import FileStorageServicePort from '../../application/ports/s3-storage.service.port';

@Injectable()
export default class LocalFileStorageAdapter implements FileStorageServicePort {
  private readonly root = join(process.cwd(), 'uploads');

  async upload(key: string, body: Buffer, _contentType: string): Promise<string> {
    const path = join(this.root, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
    return key;
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(this.root, key));
    } catch {
      return;
    }
  }

  async getSignedUrl(key: string, _expiresInSeconds?: number): Promise<string> {
    return `/uploads/${key}`;
  }
}
