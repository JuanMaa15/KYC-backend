import { InternalServerError } from "@/share/errors"

export class StorageProvider {
  constructor(private readonly bucket: R2Bucket) {}

  async upload(key: string, file: File): Promise<string> {
  try {
    await this.bucket.put(key, file, {
      httpMetadata: { contentType: file.type },
    })
    return key
  } catch (cause) {
    console.error('[StorageProvider] upload failed', { key, cause })
    throw new InternalServerError('Error al subir el archivo a R2')
  }
}
}
