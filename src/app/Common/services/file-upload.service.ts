import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UploadFileResponse {
  id: number;
  originalFileName: string;
  storedFileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private http = inject(HttpClient);
  private readonly uploadUrl = 'http://localhost:8080/api/files/upload';
  private readonly filesUrl = 'http://localhost:8080/api/files';

  /**
   * Upload file to backend, tracking progress.
   * 
   * @param file The file to upload
   * @param uploadedBy Optional name of the user uploading the file
   */
  uploadFile(file: File, uploadedBy?: string): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    if (uploadedBy) {
      formData.append('uploadedBy', uploadedBy);
    }

    const req = new HttpRequest('POST', this.uploadUrl, formData, {
      reportProgress: true,
      responseType: 'json'
    });

    return this.http.request(req);
  }

  /**
   * Delete uploaded file by ID.
   */
  deleteFile(id: number): Observable<void> {
    return this.http.delete<void>(`${this.filesUrl}/${id}`);
  }

  /**
   * Get metadata of uploaded file by ID.
   */
  getFileMetadata(id: number): Observable<any> {
    return this.http.get<any>(`${this.filesUrl}/${id}`);
  }
}
