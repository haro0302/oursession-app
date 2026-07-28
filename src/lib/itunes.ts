// iTunes Search API の薄いラッパー。認証不要・CORS対応済みでクライアントから直接叩ける。
// https://performance-partners.apple.com/search-api

export interface ArtistSuggestion {
  id: number;
  name: string;
}

export interface TrackSuggestion {
  id: number;
  name: string;
  artist: string;
}

const BASE_URL = "https://itunes.apple.com/search";

interface RawArtistResult {
  artistId: number;
  artistName: string;
}

interface RawTrackResult {
  trackId: number;
  trackName: string;
  artistName: string;
}

async function fetchItunes<T>(params: Record<string, string>, signal: AbortSignal): Promise<T[]> {
  const url = `${BASE_URL}?${new URLSearchParams(params).toString()}`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: T[] };
    return data.results ?? [];
  } catch {
    // abort・ネットワークエラー時は候補なしとして黙って返す（手入力フォールバックが常に生きているため）
    return [];
  }
}

export async function searchArtists(term: string, signal: AbortSignal): Promise<ArtistSuggestion[]> {
  const results = await fetchItunes<RawArtistResult>(
    { term, entity: "musicArtist", country: "JP", limit: "8" },
    signal
  );
  const seen = new Set<string>();
  const suggestions: ArtistSuggestion[] = [];
  for (const r of results) {
    if (!r.artistName || seen.has(r.artistName)) continue;
    seen.add(r.artistName);
    suggestions.push({ id: r.artistId, name: r.artistName });
  }
  return suggestions;
}

export async function searchTracks(term: string, signal: AbortSignal): Promise<TrackSuggestion[]> {
  const results = await fetchItunes<RawTrackResult>(
    { term, entity: "song", country: "JP", limit: "8" },
    signal
  );
  const seen = new Set<string>();
  const suggestions: TrackSuggestion[] = [];
  for (const r of results) {
    if (!r.trackName) continue;
    const key = `${r.trackName}::${r.artistName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push({ id: r.trackId, name: r.trackName, artist: r.artistName });
  }
  return suggestions;
}
