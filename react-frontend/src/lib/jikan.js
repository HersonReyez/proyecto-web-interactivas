/**
 * Anime Search & Details Service
 *
 * Supports Jikan API v4 with a fast, automatic fallback to Kitsu Anime API
 * to prevent freezes/ERR_CONNECTION_TIMED_OUT if Jikan is unreachable or rate-limited.
 */

const animeCache = new Map()
const pendingRequests = new Map()

// Fast fetch helper with timeout
async function fetchWithTimeout(url, timeoutMs = 3500) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    return response
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

/**
 * Fallback to Kitsu API for searching anime.
 */
async function searchKitsuAnime(clean, limit) {
  try {
    const res = await fetchWithTimeout(
      `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(clean)}&page[limit]=${limit}`,
      5000
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data || []).map(item => {
      const attr = item.attributes || {}
      return {
        id: item.id,
        source: 'kitsu',
        title: attr.canonicalTitle || attr.titles?.en || attr.titles?.en_jp || 'Anime',
        title_english: attr.titles?.en || '',
        title_japanese: attr.titles?.ja_jp || '',
        synopsis: attr.synopsis || attr.description || '',
        score: attr.averageRating ? (Number(attr.averageRating) / 10).toFixed(2) : null,
        status: attr.status || '',
        episodes: attr.episodeCount || null,
        year: attr.startDate ? new Date(attr.startDate).getFullYear() : null,
        genres: [],
        image: attr.posterImage?.medium || attr.posterImage?.small || attr.posterImage?.original || '',
      }
    })
  } catch (err) {
    console.warn('Kitsu search also failed:', err)
    return []
  }
}

/**
 * Searches anime via Jikan API v4, falling back to Kitsu API if unreachable.
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function searchAnime(query, limit = 6) {
  const clean = query.trim()
  if (!clean || clean.length < 2) return []

  const cacheKey = `search:${clean.toLowerCase()}:${limit}`
  if (animeCache.has(cacheKey)) {
    return animeCache.get(cacheKey)
  }

  try {
    // 1. Try Jikan API v4 with a 3.5s timeout
    const res = await fetchWithTimeout(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(clean)}&limit=${limit}&sfw=true`,
      3500
    )
    if (res.ok) {
      const json = await res.json()
      const results = (json.data || []).map(item => ({
        id: item.mal_id,
        source: 'jikan',
        title: item.title,
        title_english: item.title_english,
        title_japanese: item.title_japanese,
        synopsis: item.synopsis,
        score: item.score,
        status: item.status,
        episodes: item.episodes,
        year: item.year || item.aired?.prop?.from?.year,
        genres: (item.genres || []).map(g => g.name),
        image: item.images?.webp?.image_url || item.images?.jpg?.image_url || '',
        url: item.url,
      }))
      animeCache.set(cacheKey, results)
      results.forEach(anime => animeCache.set(`anime:${anime.id}`, anime))
      return results
    }
  } catch (jikanError) {
    console.warn('Jikan API timed out or unavailable, switching to fallback (Kitsu)...', jikanError.message)
  }

  // 2. Fallback to Kitsu API
  const kitsuResults = await searchKitsuAnime(clean, limit)
  if (kitsuResults.length > 0) {
    animeCache.set(cacheKey, kitsuResults)
    kitsuResults.forEach(anime => animeCache.set(`anime:${anime.id}`, anime))
  }
  return kitsuResults
}

/**
 * Gets details for a specific anime by ID.
 * @param {number|string} id
 * @returns {Promise<Object|null>}
 */
export async function getAnimeDetails(id) {
  if (!id) return null
  const cacheKey = `anime:${id}`

  if (animeCache.has(cacheKey)) {
    return animeCache.get(cacheKey)
  }

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)
  }

  const promise = (async () => {
    // 1. Try Jikan
    try {
      const res = await fetchWithTimeout(`https://api.jikan.moe/v4/anime/${id}`, 3500)
      if (res.ok) {
        const json = await res.json()
        const item = json.data
        if (item) {
          const details = {
            id: item.mal_id,
            source: 'jikan',
            title: item.title,
            title_english: item.title_english,
            title_japanese: item.title_japanese,
            synopsis: item.synopsis,
            score: item.score,
            status: item.status,
            episodes: item.episodes,
            year: item.year || item.aired?.prop?.from?.year,
            genres: (item.genres || []).map(g => g.name),
            image: item.images?.webp?.image_url || item.images?.jpg?.image_url || '',
            url: item.url,
          }
          animeCache.set(cacheKey, details)
          return details
        }
      }
    } catch {
      // ignore, fall through to Kitsu
    }

    // 2. Try Kitsu
    try {
      const res = await fetchWithTimeout(`https://kitsu.io/api/edge/anime/${id}`, 4000)
      if (res.ok) {
        const json = await res.json()
        const item = json.data
        if (item) {
          const attr = item.attributes || {}
          const details = {
            id: item.id,
            source: 'kitsu',
            title: attr.canonicalTitle || attr.titles?.en || 'Anime',
            title_english: attr.titles?.en || '',
            title_japanese: attr.titles?.ja_jp || '',
            synopsis: attr.synopsis || attr.description || '',
            score: attr.averageRating ? (Number(attr.averageRating) / 10).toFixed(2) : null,
            status: attr.status || '',
            episodes: attr.episodeCount || null,
            year: attr.startDate ? new Date(attr.startDate).getFullYear() : null,
            genres: [],
            image: attr.posterImage?.medium || attr.posterImage?.small || '',
          }
          animeCache.set(cacheKey, details)
          return details
        }
      }
    } catch (err) {
      console.warn('Error fetching details:', err)
    }

    return null
  })().finally(() => {
    pendingRequests.delete(cacheKey)
  })

  pendingRequests.set(cacheKey, promise)
  return promise
}
