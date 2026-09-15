export type FileUploadView = {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  key: string;
};

export type FileDownloadView = {
  url: string;
  key: string;
};
