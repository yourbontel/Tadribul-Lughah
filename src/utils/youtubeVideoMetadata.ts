import { extractOptionalYouTubeId, isValidYouTubeVideoInput } from '../data/moduleContentData';

export interface YouTubeVideoMetadata {
  videoId: string;
  title: string;
  channel: string;
}

/**
 * Mengambil judul video & nama channel YouTube secara otomatis (proxy oEmbed PHP + fallback noembed CORS).
 */
export async function fetchYouTubeMetadata(
  youtubeInput: string
): Promise<YouTubeVideoMetadata | null> {
  if (!isValidYouTubeVideoInput(youtubeInput)) return null;
  const videoId = extractOptionalYouTubeId(youtubeInput);
  if (!videoId) return null;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // 1. Lewat proxy PHP cPanel (youtube.com/oembed resmi, bebas CORS)
  try {
    const res = await fetch(
      `./api.php?action=youtube_oembed&url=${encodeURIComponent(watchUrl)}`
    );
    const raw = await res.text();
    if (res.ok && !raw.trimStart().startsWith('<?php')) {
      const json = JSON.parse(raw);
      if (json && (json.title || json.channel)) {
        return {
          videoId,
          title: String(json.title || '').trim(),
          channel: String(json.channel || '').trim()
        };
      }
    }
  } catch {
    // Fallback ke noembed.com di bawah
  }

  // 2. Fallback publik mendukung CORS (cocok untuk dev Vite lokal atau backup)
  try {
    const resNoembed = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(watchUrl)}`
    );
    if (resNoembed.ok) {
      const data = await resNoembed.json();
      if (data && (data.title || data.author_name)) {
        return {
          videoId,
          title: String(data.title || '').trim(),
          channel: String(data.author_name || '').trim()
        };
      }
    }
  } catch {
    // Abaikan error network
  }

  return null;
}
