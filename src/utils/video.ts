/**
 * Normalizes embed URLs for iframe `src`. Mock data and Supabase can store
 * full watch URLs or direct embed URLs — this keeps the player consistent.
 */
export function toEmbedSrc(embedType: 'youtube' | 'vimeo', url: string): string {
  if (url.includes('youtube.com/embed') || url.includes('player.vimeo.com')) {
    return url
  }

  if (embedType === 'youtube') {
    const id = extractYoutubeId(url)
    return id ? `https://www.youtube.com/embed/${id}` : url
  }

  const vimeoId = extractVimeoId(url)
  return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : url
}

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace('/', '') || null
    }
    if (u.searchParams.get('v')) {
      return u.searchParams.get('v')
    }
    const parts = u.pathname.split('/')
    const embedIdx = parts.indexOf('embed')
    if (embedIdx !== -1 && parts[embedIdx + 1]) {
      return parts[embedIdx + 1]
    }
  } catch {
    return null
  }
  return null
}

function extractVimeoId(url: string): string | null {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    return last && /^\d+$/.test(last) ? last : null
  } catch {
    return null
  }
}
