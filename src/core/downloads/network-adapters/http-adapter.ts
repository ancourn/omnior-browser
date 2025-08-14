import { NetworkAdapter } from '../models';
import { EventEmitter } from 'events';
import https from 'https';
import http from 'http';
import { URL } from 'url';

export class HttpNetworkAdapter extends EventEmitter implements NetworkAdapter {
  private activeRequests = new Map<string, http.ClientRequest>();
  private requestTimeout: number = 30000; // 30 seconds
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  async supportsRange(url: string): Promise<boolean> {
    try {
      const response = await this.makeHeadRequest(url);
      const acceptRanges = response.headers['accept-ranges'];
      const contentLength = response.headers['content-length'];
      
      return acceptRanges === 'bytes' && contentLength !== undefined;
    } catch (error) {
      console.error('Error checking range support:', error);
      return false;
    }
  }

  async getContentLength(url: string): Promise<number> {
    try {
      const response = await this.makeHeadRequest(url);
      const contentLength = response.headers['content-length'];
      
      if (!contentLength) {
        throw new Error('Content-Length header not found');
      }
      
      return parseInt(contentLength, 10);
    } catch (error) {
      console.error('Error getting content length:', error);
      throw error;
    }
  }

  async downloadChunk(
    url: string, 
    start: number, 
    end: number | undefined, 
    onProgress?: (downloaded: number) => void
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substr(2, 9);
      let downloaded = 0;
      let retries = 0;
      let timeoutId: NodeJS.Timeout;

      const attemptDownload = () => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        const options: http.RequestOptions = {
          method: 'GET',
          headers: {
            'User-Agent': 'Omnior-Browser/1.0',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
          }
        };

        // Add range header if specified
        if (start !== undefined && end !== undefined) {
          options.headers!['Range'] = `bytes=${start}-${end}`;
        }

        const req = httpModule.request(url, options, (res) => {
          // Handle redirects
          if ([301, 302, 303, 307, 308].includes(res.statusCode!)) {
            const location = res.headers.location;
            if (location) {
              req.destroy();
              this.downloadChunk(location, start, end, onProgress)
                .then(resolve)
                .catch(reject);
              return;
            }
          }

          // Handle error responses
          if (res.statusCode && res.statusCode >= 400) {
            req.destroy();
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            return;
          }

          // Handle range request response
          if (start !== undefined && end !== undefined && res.statusCode !== 206) {
            req.destroy();
            reject(new Error('Server does not support range requests'));
            return;
          }

          const chunks: Buffer[] = [];
          let totalLength = 0;

          res.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
            totalLength += chunk.length;
            downloaded += chunk.length;
            
            if (onProgress) {
              onProgress(downloaded);
            }
            
            // Emit progress event
            this.emit('progress', { downloaded, total: totalLength });
          });

          res.on('end', () => {
            clearTimeout(timeoutId);
            this.activeRequests.delete(requestId);
            
            const data = Buffer.concat(chunks);
            resolve(data);
          });

          res.on('error', (error) => {
            clearTimeout(timeoutId);
            this.activeRequests.delete(requestId);
            reject(error);
          });
        });

        req.on('error', (error) => {
          clearTimeout(timeoutId);
          this.activeRequests.delete(requestId);
          
          if (retries < this.maxRetries) {
            retries++;
            setTimeout(attemptDownload, this.retryDelay * Math.pow(2, retries - 1));
          } else {
            reject(error);
          }
        });

        req.on('timeout', () => {
          req.destroy();
          if (retries < this.maxRetries) {
            retries++;
            setTimeout(attemptDownload, this.retryDelay * Math.pow(2, retries - 1));
          } else {
            reject(new Error('Request timeout'));
          }
        });

        // Set timeout
        timeoutId = setTimeout(() => {
          req.emit('timeout');
        }, this.requestTimeout);

        req.setTimeout(this.requestTimeout);
        this.activeRequests.set(requestId, req);
        req.end();
      };

      attemptDownload();
    });
  }

  private makeHeadRequest(url: string): Promise<http.IncomingMessage> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const options: http.RequestOptions = {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Omnior-Browser/1.0',
          'Accept': '*/*',
          'Connection': 'keep-alive'
        }
      };

      const req = httpModule.request(url, options, (res) => {
        // Handle redirects
        if ([301, 302, 303, 307, 308].includes(res.statusCode!)) {
          const location = res.headers.location;
          if (location) {
            req.destroy();
            this.makeHeadRequest(location)
              .then(resolve)
              .catch(reject);
            return;
          }
        }

        req.destroy();
        resolve(res);
      });

      req.on('error', reject);
      req.setTimeout(this.requestTimeout, () => {
        req.destroy();
        reject(new Error('HEAD request timeout'));
      });

      req.end();
    });
  }

  cancelAll(): void {
    for (const [requestId, req] of this.activeRequests) {
      req.destroy();
    }
    this.activeRequests.clear();
  }

  setRequestTimeout(timeout: number): void {
    this.requestTimeout = timeout;
  }

  setMaxRetries(retries: number): void {
    this.maxRetries = retries;
  }

  setRetryDelay(delay: number): void {
    this.retryDelay = delay;
  }
}