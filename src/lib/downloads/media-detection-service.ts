"use server"

import { MediaDetectionResult, MediaQuality } from "@/types/downloads"

// Content type arrays
const videoContentTypes = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska"
]

const audioContentTypes = [
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
  "audio/mpeg"
]

const streamContentTypes = [
  "application/vnd.apple.mpegurl", // HLS
  "application/dash+xml",          // DASH
  "application/x-mpegURL"
]

export async function detectMediaOnPage(url: string, html?: string): Promise<MediaDetectionResult[]> {
  const results: MediaDetectionResult[] = []

  try {
    // If HTML is provided, parse it for media elements
    if (html) {
      const mediaElements = parseMediaElements(html, url)
      results.push(...mediaElements)
    }

    // Also analyze the URL itself if it's a direct media link
    const directMedia = await analyzeDirectURL(url)
    if (directMedia) {
      results.push(directMedia)
    }

    // Remove duplicates and filter out DRM-protected content
    const uniqueResults = deduplicateResults(results)
    const filteredResults = uniqueResults.filter(result => !result.isDRMProtected)

    return filteredResults
  } catch (error) {
    console.error("Error detecting media:", error)
    return []
  }
}

function parseMediaElements(html: string, baseUrl: string): MediaDetectionResult[] {
  const results: MediaDetectionResult[] = []
  
  // Parse video elements
  const videoMatches = html.match(/<video[^>]*>[\s\S]*?<\/video>/gi) || []
  for (const videoMatch of videoMatches) {
    const srcMatch = videoMatch.match(/src=["']([^"']+)["']/i)
    const typeMatch = videoMatch.match(/type=["']([^"']+)["']/i)
    
    if (srcMatch) {
      const src = resolveUrl(srcMatch[1], baseUrl)
      const contentType = typeMatch ? typeMatch[1] : guessContentTypeFromUrl(src)
      
      results.push({
        url: src,
        contentType,
        mediaType: getMediaType(contentType, src),
        isStreamable: isStreamable(contentType, src),
        isDRMProtected: hasDRMIndicators(videoMatch)
      })
    }
  }

  // Parse audio elements
  const audioMatches = html.match(/<audio[^>]*>[\s\S]*?<\/audio>/gi) || []
  for (const audioMatch of audioMatches) {
    const srcMatch = audioMatch.match(/src=["']([^"']+)["']/i)
    const typeMatch = audioMatch.match(/type=["']([^"']+)["']/i)
    
    if (srcMatch) {
      const src = resolveUrl(srcMatch[1], baseUrl)
      const contentType = typeMatch ? typeMatch[1] : guessContentTypeFromUrl(src)
      
      results.push({
        url: src,
        contentType,
        mediaType: getMediaType(contentType, src),
        isStreamable: isStreamable(contentType, src),
        isDRMProtected: false // Audio typically doesn't have DRM in this context
      })
    }
  }

  // Parse source elements
  const sourceMatches = html.match(/<source[^>]*>/gi) || []
  for (const sourceMatch of sourceMatches) {
    const srcMatch = sourceMatch.match(/src=["']([^"']+)["']/i)
    const typeMatch = sourceMatch.match(/type=["']([^"']+)["']/i)
    
    if (srcMatch) {
      const src = resolveUrl(srcMatch[1], baseUrl)
      const contentType = typeMatch ? typeMatch[1] : guessContentTypeFromUrl(src)
      
      results.push({
        url: src,
        contentType,
        mediaType: getMediaType(contentType, src),
        isStreamable: isStreamable(contentType, src),
        isDRMProtected: false
      })
    }
  }

  // Look for HLS/DASH manifest URLs in script tags or meta tags
  const manifestUrls = extractManifestUrls(html, baseUrl)
  for (const manifestUrl of manifestUrls) {
    results.push({
      url: manifestUrl.url,
      contentType: manifestUrl.contentType,
      mediaType: manifestUrl.mediaType,
      isStreamable: true,
      isDRMProtected: false
    })
  }

  return results
}

async function analyzeDirectURL(url: string): Promise<MediaDetectionResult | null> {
  try {
    const response = await fetch(url, { method: "HEAD" })
    
    if (!response.ok) {
      return null
    }

    const contentType = response.headers.get("content-type") || ""
    const contentLength = response.headers.get("content-length")
    const fileSize = contentLength ? parseInt(contentLength) : undefined

    // Check if this is a media URL
    if (!isMediaContentType(contentType) && !isMediaUrl(url)) {
      return null
    }

    return {
      url,
      contentType,
      fileSize,
      mediaType: getMediaType(contentType, url),
      isStreamable: isStreamable(contentType, url),
      isDRMProtected: await checkDRMProtection(url, contentType)
    }
  } catch (error) {
    console.error("Error analyzing direct URL:", error)
    return null
  }
}

function extractManifestUrls(html: string, baseUrl: string): Array<{url: string, contentType: string, mediaType: string}> {
  const manifests: Array<{url: string, contentType: string, mediaType: string}> = []

  // Look for m3u8 files
  const m3u8Matches = html.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi) || []
  for (const match of m3u8Matches) {
    manifests.push({
      url: match,
      contentType: "application/vnd.apple.mpegurl",
      mediaType: "hls"
    })
  }

  // Look for mpd files
  const mpdMatches = html.match(/https?:\/\/[^\s"'<>]+\.mpd[^\s"'<>]*/gi) || []
  for (const match of mpdMatches) {
    manifests.push({
      url: match,
      contentType: "application/dash+xml",
      mediaType: "dash"
    })
  }

  // Look in script tags for manifest URLs
  const scriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || []
  for (const scriptMatch of scriptMatches) {
    // Look for m3u8 URLs in script content
    const scriptM3u8Matches = scriptMatch.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi) || []
    for (const match of scriptM3u8Matches) {
      manifests.push({
        url: match,
        contentType: "application/vnd.apple.mpegurl",
        mediaType: "hls"
      })
    }

    // Look for mpd URLs in script content
    const scriptMpdMatches = scriptMatch.match(/https?:\/\/[^\s"'<>]+\.mpd[^\s"'<>]*/gi) || []
    for (const match of scriptMpdMatches) {
      manifests.push({
        url: match,
        contentType: "application/dash+xml",
        mediaType: "dash"
      })
    }
  }

  return manifests.map(manifest => ({
    ...manifest,
    url: resolveUrl(manifest.url, baseUrl)
  }))
}

function resolveUrl(url: string, baseUrl: string): string {
  try {
    // If it's already a full URL, return as-is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url
    }

    // Resolve relative URL
    return new URL(url, baseUrl).href
  } catch {
    return url
  }
}

function guessContentTypeFromUrl(url: string): string {
  const extension = url.toLowerCase().split('.').pop()
  
  const extensionMap: Record<string, string> = {
    "mp4": "video/mp4",
    "webm": "video/webm",
    "ogg": "video/ogg",
    "ogv": "video/ogg",
    "mov": "video/quicktime",
    "avi": "video/x-msvideo",
    "mkv": "video/x-matroska",
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "flac": "audio/flac",
    "aac": "audio/aac",
    "m3u8": "application/vnd.apple.mpegurl",
    "mpd": "application/dash+xml"
  }

  return extensionMap[extension] || "application/octet-stream"
}

function isMediaContentType(contentType: string): boolean {
  return [
    ...videoContentTypes,
    ...audioContentTypes,
    ...streamContentTypes
  ].includes(contentType)
}

function isMediaUrl(url: string): boolean {
  const mediaExtensions = [
    ".mp4", ".webm", ".ogg", ".ogv", ".mov", ".avi", ".mkv",
    ".mp3", ".wav", ".flac", ".aac",
    ".m3u8", ".mpd"
  ]
  
  return mediaExtensions.some(ext => url.toLowerCase().includes(ext))
}

function getMediaType(contentType: string, url: string): "hls" | "dash" | "video" | "audio" | "file" {
  if (contentType.includes("application/vnd.apple.mpegurl") || url.includes(".m3u8")) {
    return "hls"
  }
  
  if (contentType.includes("application/dash+xml") || url.includes(".mpd")) {
    return "dash"
  }
  
  if (contentType.startsWith("video/")) {
    return "video"
  }
  
  if (contentType.startsWith("audio/")) {
    return "audio"
  }
  
  return "file"
}

function isStreamable(contentType: string, url: string): boolean {
  return getMediaType(contentType, url) === "hls" || 
         getMediaType(contentType, url) === "dash"
}

function hasDRMIndicators(elementHtml: string): boolean {
  const drmIndicators = [
    "drm",
    "encrypted",
    "widevine",
    "fairplay",
    "playready",
    "eme",
    "encryption"
  ]
  
  return drmIndicators.some(indicator => 
    elementHtml.toLowerCase().includes(indicator)
  )
}

async function checkDRMProtection(url: string, contentType: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" })
    
    // Check for DRM-related headers
    const drmHeaders = [
      "x-drm",
      "drm",
      "encryption",
      "widevine",
      "fairplay",
      "playready"
    ]
    
    const headers = response.headers
    for (const [key, value] of headers.entries()) {
      if (drmHeaders.some(indicator => 
        key.toLowerCase().includes(indicator) ||
        value.toLowerCase().includes(indicator)
      )) {
        return true
      }
    }

    // Check content type for DRM indicators
    const drmIndicators = [
      "drm",
      "encrypted",
      "widevine",
      "fairplay",
      "playready",
      "eme",
      "encryption"
    ]
    
    return drmIndicators.some(indicator => 
      contentType.toLowerCase().includes(indicator) ||
      url.toLowerCase().includes(indicator)
    )
  } catch {
    return false
  }
}

function deduplicateResults(results: MediaDetectionResult[]): MediaDetectionResult[] {
  const seen = new Set<string>()
  return results.filter(result => {
    const key = result.url
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

export async function getMediaQualities(url: string, mediaType: string): Promise<MediaQuality[]> {
  if (mediaType === "hls") {
    return await parseHLSQualities(url)
  } else if (mediaType === "dash") {
    return await parseDASHQualities(url)
  } else {
    return []
  }
}

async function parseHLSQualities(url: string): Promise<MediaQuality[]> {
  try {
    const response = await fetch(url)
    const manifest = await response.text()
    
    const qualities: MediaQuality[] = []
    const lines = manifest.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        const bitrateMatch = line.match(/BANDWIDTH=(\d+)/)
        const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/)
        const codecsMatch = line.match(/CODECS="([^"]+)"/)
        
        if (bitrateMatch && lines[i + 1]) {
          qualities.push({
            bitrate: parseInt(bitrateMatch[1]),
            resolution: resolutionMatch ? resolutionMatch[1] : undefined,
            codec: codecsMatch ? codecsMatch[1] : undefined,
            url: resolveUrl(lines[i + 1].trim(), url)
          })
        }
      }
    }
    
    return qualities
  } catch (error) {
    console.error("Error parsing HLS qualities:", error)
    return []
  }
}

async function parseDASHQualities(url: string): Promise<MediaQuality[]> {
  try {
    const response = await fetch(url)
    const manifest = await response.text()
    
    const qualities: MediaQuality[] = []
    
    // Simple DASH parsing - in real implementation, you'd use a proper XML parser
    const representationMatches = manifest.match(/<Representation[^>]*>[\s\S]*?<\/Representation>/gi) || []
    
    for (const representation of representationMatches) {
      const bandwidthMatch = representation.match(/bandwidth="(\d+)"/i)
      const widthMatch = representation.match(/width="(\d+)"/i)
      const heightMatch = representation.match(/height="(\d+)"/i)
      const codecsMatch = representation.match(/codecs="([^"]+)"/i)
      const baseUrlMatch = representation.match(/<BaseURL>([^<]+)<\/BaseURL>/i)
      
      if (bandwidthMatch && baseUrlMatch) {
        qualities.push({
          bitrate: parseInt(bandwidthMatch[1]),
          resolution: widthMatch && heightMatch ? `${widthMatch[1]}x${heightMatch[1]}` : undefined,
          codec: codecsMatch ? codecsMatch[1] : undefined,
          url: resolveUrl(baseUrlMatch[1], url)
        })
      }
    }
    
    return qualities
  } catch (error) {
    console.error("Error parsing DASH qualities:", error)
    return []
  }
}