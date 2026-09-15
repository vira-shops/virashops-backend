import type { FileUploadView } from '../../../domain/view-models/file.view-model';

export type FileUploadHttpResponse = FileUploadView;

export type FileDownloadHttpResponse = {
  url: string;
  key: string;
};

export default class FileHttpMapper {
  static toUploadResponse(view: FileUploadView): FileUploadHttpResponse {
    return {
      id: view.id,
      filename: view.filename,
      originalName: view.originalName,
      mimetype: view.mimetype,
      size: view.size,
      url: view.url,
      key: view.key,
    };
  }

  static toDownloadResponse(
    url: string,
    key: string,
  ): FileDownloadHttpResponse {
    return { url, key };
  }
}
