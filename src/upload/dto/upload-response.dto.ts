export class UploadResponseDto {
  url: string;
  publicId: string;
  format: number;
  width: number;
  height: number;
  bytes: number;
}

export class MultipleUploadResponseDto {
  urls: string[];
  files: UploadResponseDto[];
}
