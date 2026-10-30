import { useEffect, useRef, useState } from 'react'
import { getAnimeDetails } from '../lib/jikan'
import { Icon } from './ui'

export default function AnimeHoverCard({ animeId, fallbackTitle, fallbackImage, cardRef: externalRef }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (!animeId) {
      setLoading(false)
      return
    }

    getAnimeDetails(animeId).then(res => {
      if (active) {
        setData(res)
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [animeId])

  const title = data?.title || fallbackTitle || 'Anime'
  const image = data?.image || fallbackImage
  const synopsis = data?.synopsis || 'Sin descripción disponible.'
  const genres = data?.genres || []

  return (
    <div className="anime-hover-card" ref={externalRef}>
      <div className="anime-card-header">
        {image && <img src={image} alt={title} className="anime-card-thumb" />}
        <div className="anime-card-header-info">
          <span className="anime-card-tag">{data?.source ? data.source.toUpperCase() : 'ANIME'}</span>
          <h4 className="anime-card-title">{title}</h4>
          {data?.title_japanese && <p className="anime-card-jp">{data.title_japanese}</p>}
          <div className="anime-card-meta">
            {data?.score && (
              <span className="anime-meta-badge score">
                <Icon name="star" size={12} /> {data.score}
              </span>
            )}
            {data?.status && <span className="anime-meta-badge status">{data.status}</span>}
            {data?.year && <span className="anime-meta-badge">{data.year}</span>}
          </div>
        </div>
      </div>

      {genres.length > 0 && (
        <div className="anime-card-genres">
          {genres.slice(0, 4).map(g => (
            <span key={g} className="anime-genre-pill">{g}</span>
          ))}
        </div>
      )}

      <div className="anime-card-body">
        {loading ? (
          <p className="anime-card-loading">Consultando detalles de la obra…</p>
        ) : (
          <p className="anime-card-synopsis">{synopsis}</p>
        )}
      </div>
    </div>
  )
}
