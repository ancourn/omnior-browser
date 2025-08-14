export interface MediaDetectionResult {
  type: 'video' | 'audio' | 'document' | 'image' | 'other';
  url: string;
  element: HTMLElement;
  title?: string;
  duration?: number;
  quality?: string;
  format?: string;
}

export interface DetectionOptions {
  scanInterval?: number; // ms
  enableVideoDetection?: boolean;
  enableAudioDetection?: boolean;
  enableDocumentDetection?: boolean;
  enableImageDetection?: boolean;
  minVideoDuration?: number; // seconds
  maxResults?: number;
}

export class MediaDetectorService {
  private options: DetectionOptions;
  private scanIntervalId?: NodeJS.Timeout;
  private callbacks = new Set<(results: MediaDetectionResult[]) => void>();
  private lastScanTime = 0;
  private detectedMedia = new Set<string>();

  constructor(options: DetectionOptions = {}) {
    this.options = {
      scanInterval: 2000,
      enableVideoDetection: true,
      enableAudioDetection: true,
      enableDocumentDetection: true,
      enableImageDetection: false,
      minVideoDuration: 10,
      maxResults: 10,
      ...options
    };
  }

  start(): void {
    if (this.scanIntervalId) return;
    
    this.scanIntervalId = setInterval(() => {
      this.scanPage();
    }, this.options.scanInterval);
    
    // Initial scan
    this.scanPage();
  }

  stop(): void {
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
      this.scanIntervalId = undefined;
    }
  }

  onDetection(callback: (results: MediaDetectionResult[]) => void): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private async scanPage(): Promise<void> {
    const now = Date.now();
    if (now - this.lastScanTime < this.options.scanInterval! - 100) {
      return; // Avoid too frequent scans
    }
    
    this.lastScanTime = now;
    
    try {
      const results: MediaDetectionResult[] = [];
      
      if (this.options.enableVideoDetection) {
        results.push(...await this.detectVideos());
      }
      
      if (this.options.enableAudioDetection) {
        results.push(...await this.detectAudio());
      }
      
      if (this.options.enableDocumentDetection) {
        results.push(...await this.detectDocuments());
      }
      
      if (this.options.enableImageDetection) {
        results.push(...await this.detectImages());
      }
      
      // Filter out already detected media and limit results
      const newResults = results
        .filter(result => !this.detectedMedia.has(result.url))
        .slice(0, this.options.maxResults);
      
      if (newResults.length > 0) {
        // Add to detected set
        newResults.forEach(result => this.detectedMedia.add(result.url));
        
        // Notify callbacks
        this.callbacks.forEach(callback => {
          try {
            callback(newResults);
          } catch (error) {
            console.error('Error in media detection callback:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error scanning page for media:', error);
    }
  }

  private async detectVideos(): Promise<MediaDetectionResult[]> {
    const results: MediaDetectionResult[] = [];
    
    try {
      // Detect HTML5 video elements
      const videoElements = document.querySelectorAll('video');
      for (const video of videoElements) {
        const src = video.currentSrc || video.src;
        if (!src) continue;
        
        const result: MediaDetectionResult = {
          type: 'video',
          url: src,
          element: video as HTMLElement,
          title: this.getElementTitle(video as HTMLElement),
          duration: video.duration,
          format: this.getFormatFromUrl(src)
        };
        
        if (result.duration && result.duration >= this.options.minVideoDuration!) {
          results.push(result);
        }
      }
      
      // Detect video sources
      const sourceElements = document.querySelectorAll('source[type^="video/"]');
      for (const source of sourceElements) {
        const src = (source as HTMLSourceElement).src;
        if (!src) continue;
        
        const result: MediaDetectionResult = {
          type: 'video',
          url: src,
          element: source as HTMLElement,
          format: this.getFormatFromUrl(src)
        };
        
        results.push(result);
      }
      
      // Detect embedded videos (YouTube, Vimeo, etc.)
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        const src = (iframe as HTMLIFrameElement).src;
        if (!src) continue;
        
        const videoInfo = this.extractVideoFromEmbed(src);
        if (videoInfo) {
          results.push({
            type: 'video',
            url: videoInfo.url,
            element: iframe as HTMLElement,
            title: videoInfo.title,
            format: videoInfo.format
          });
        }
      }
      
    } catch (error) {
      console.error('Error detecting videos:', error);
    }
    
    return results;
  }

  private async detectAudio(): Promise<MediaDetectionResult[]> {
    const results: MediaDetectionResult[] = [];
    
    try {
      // Detect HTML5 audio elements
      const audioElements = document.querySelectorAll('audio');
      for (const audio of audioElements) {
        const src = audio.currentSrc || audio.src;
        if (!src) continue;
        
        const result: MediaDetectionResult = {
          type: 'audio',
          url: src,
          element: audio as HTMLElement,
          title: this.getElementTitle(audio as HTMLElement),
          duration: audio.duration,
          format: this.getFormatFromUrl(src)
        };
        
        results.push(result);
      }
      
      // Detect audio sources
      const sourceElements = document.querySelectorAll('source[type^="audio/"]');
      for (const source of sourceElements) {
        const src = (source as HTMLSourceElement).src;
        if (!src) continue;
        
        const result: MediaDetectionResult = {
          type: 'audio',
          url: src,
          element: source as HTMLElement,
          format: this.getFormatFromUrl(src)
        };
        
        results.push(result);
      }
      
    } catch (error) {
      console.error('Error detecting audio:', error);
    }
    
    return results;
  }

  private async detectDocuments(): Promise<MediaDetectionResult[]> {
    const results: MediaDetectionResult[] = [];
    
    try {
      // Detect document links
      const links = document.querySelectorAll('a[href]');
      for (const link of links) {
        const href = (link as HTMLAnchorElement).href;
        if (!href) continue;
        
        const format = this.getDocumentFormat(href);
        if (format) {
          results.push({
            type: 'document',
            url: href,
            element: link as HTMLElement,
            title: link.textContent || undefined,
            format
          });
        }
      }
      
    } catch (error) {
      console.error('Error detecting documents:', error);
    }
    
    return results;
  }

  private async detectImages(): Promise<MediaDetectionResult[]> {
    const results: MediaDetectionResult[] = [];
    
    try {
      // Detect image elements
      const images = document.querySelectorAll('img');
      for (const img of images) {
        const src = img.currentSrc || img.src;
        if (!src) continue;
        
        const result: MediaDetectionResult = {
          type: 'image',
          url: src,
          element: img as HTMLElement,
          title: (img as HTMLImageElement).alt || undefined,
          format: this.getFormatFromUrl(src)
        };
        
        results.push(result);
      }
      
    } catch (error) {
      console.error('Error detecting images:', error);
    }
    
    return results;
  }

  private getElementTitle(element: HTMLElement): string | undefined {
    // Try to get title from various attributes
    const title = element.getAttribute('title') || 
                  element.getAttribute('alt') || 
                  element.getAttribute('data-title') ||
                  element.textContent?.trim();
    
    return title || undefined;
  }

  private getFormatFromUrl(url: string): string | undefined {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const extension = pathname.split('.').pop()?.toLowerCase();
      
      return extension || undefined;
    } catch {
      return undefined;
    }
  }

  private getDocumentFormat(url: string): string | undefined {
    const documentFormats = [
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'txt', 'rtf', 'odt', 'ods', 'odp', 'csv', 'json', 'xml'
    ];
    
    const format = this.getFormatFromUrl(url);
    return format && documentFormats.includes(format) ? format : undefined;
  }

  private extractVideoFromEmbed(src: string): { url: string; title?: string; format?: string } | null {
    try {
      const urlObj = new URL(src);
      
      // YouTube
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        const videoId = this.extractYouTubeVideoId(src);
        if (videoId) {
          return {
            url: `https://www.youtube.com/watch?v=${videoId}`,
            title: 'YouTube Video',
            format: 'youtube'
          };
        }
      }
      
      // Vimeo
      if (urlObj.hostname.includes('vimeo.com')) {
        const videoId = src.match(/vimeo\.com\/(\d+)/)?.[1];
        if (videoId) {
          return {
            url: `https://vimeo.com/${videoId}`,
            title: 'Vimeo Video',
            format: 'vimeo'
          };
        }
      }
      
    } catch (error) {
      console.error('Error extracting video from embed:', error);
    }
    
    return null;
  }

  private extractYouTubeVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  updateOptions(options: Partial<DetectionOptions>): void {
    this.options = { ...this.options, ...options };
  }

  clearDetectedMedia(): void {
    this.detectedMedia.clear();
  }

  getDetectedMediaCount(): number {
    return this.detectedMedia.size;
  }
}