import { useEffect, useState } from 'react'
import { api, errorMessage, productImageUrl } from '../lib/api'
import { searchAnime } from '../lib/jikan'
import { Field, Icon, Notice } from './ui'
import Modal from './Modal'

export default function ProductForm({ product = null, onClose, onSaved }) {
  const [values, setValues] = useState(() => ({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price != null ? Number(product.price).toFixed(2) : '',
    stock: product?.stock ?? '',
    anime_id: product?.anime_id ?? '',
    anime_title: product?.anime_title || '',
    anime_image_url: product?.anime_image_url || '',
  }))
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(productImageUrl(product?.image_path))
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const editing = Boolean(product)

  // Anime search states
  const [animeQuery, setAnimeQuery] = useState('')
  const [animeResults, setAnimeResults] = useState([])
  const [searchingAnime, setSearchingAnime] = useState(false)
  const [searchFeedback, setSearchFeedback] = useState('')

  useEffect(() => {
    if (!image) {
      setPreview(productImageUrl(product?.image_path))
      return undefined
    }
    const objectUrl = URL.createObjectURL(image)
    setPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [image, product?.image_path])

  // Debounce anime search
  useEffect(() => {
    const term = animeQuery.trim()
    if (!term || term.length < 2) {
      setAnimeResults([])
      setSearchingAnime(false)
      setSearchFeedback('')
      return
    }

    setSearchingAnime(true)
    setSearchFeedback('')
    const timeout = setTimeout(async () => {
      try {
        const results = await searchAnime(term, 6)
        setAnimeResults(results)
        if (!results || results.length === 0) {
          setSearchFeedback(`No se encontraron animes para "${term}". Puedes usar el botón "Usar texto".`)
        }
      } catch {
        setSearchFeedback('No se pudo conectar con el catálogo de anime en este momento.')
      } finally {
        setSearchingAnime(false)
      }
    }, 400)

    return () => clearTimeout(timeout)
  }, [animeQuery])

  function changeField(event) {
    const { name, value } = event.target
    setValues(previous => ({ ...previous, [name]: value }))
    setErrors(previous => ({ ...previous, [name]: undefined }))
    setMessage('')
  }

  function selectAnime(anime) {
    setValues(previous => ({
      ...previous,
      anime_id: anime.id,
      anime_title: anime.title,
      anime_image_url: anime.image || '',
    }))
    setAnimeQuery('')
    setAnimeResults([])
    setSearchFeedback('')
  }

  function clearAnime() {
    setValues(previous => ({
      ...previous,
      anime_id: '',
      anime_title: '',
      anime_image_url: '',
    }))
    setSearchFeedback('')
  }

  function assignCustomAnime() {
    if (!animeQuery.trim()) return
    setValues(previous => ({
      ...previous,
      anime_id: '',
      anime_title: animeQuery.trim(),
      anime_image_url: '',
    }))
    setAnimeQuery('')
    setAnimeResults([])
    setSearchFeedback('')
  }

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setErrors({})
    setMessage('')
    const payload = new FormData()
    payload.append('name', values.name)
    payload.append('description', values.description)
    payload.append('price', values.price)
    payload.append('stock', values.stock)
    payload.append('anime_id', values.anime_id || '')
    payload.append('anime_title', values.anime_title || '')
    payload.append('anime_image_url', values.anime_image_url || '')
    if (image) payload.append('image', image)

    try {
      if (editing) {
        payload.append('id', product.id)
        payload.append('_method', 'PUT')
        await api.post(`/product/${product.id}`, payload)
        onSaved('El producto se actualizó correctamente.')
      } else {
        await api.post('/product', payload)
        onSaved('El producto se creó correctamente.')
      }
    } catch (failure) {
      setErrors(failure.response?.data?.errors || {})
      setMessage(errorMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  return <Modal title={editing ? 'Editar producto' : 'Crear producto'} onClose={onClose} busy={busy}>
    <p className="dialog-description">{editing ? 'Actualiza la información, anime e inventario del producto.' : 'Agrega una pieza nueva al catálogo de Anime Store vinculada a su anime.'}</p>
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <Notice>{message}</Notice>
        <Field label="Nombre del producto" name="name" autoComplete="off" required maxLength={255} value={values.name} error={errors.name?.[0]} onChange={changeField} />
        <div className="field"><label htmlFor="product-description">Descripción</label><textarea id="product-description" name="description" required maxLength={255} rows={3} value={values.description} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'product-description-help' : undefined} onChange={changeField} />{errors.description && <small id="product-description-help" className="field-error">{errors.description[0]}</small>}</div>
        
        {/* Vinculación con API de Anime */}
        <div className="field anime-selector-field">
          <label>Anime al que pertenece</label>
          {values.anime_title ? (
            <div className="selected-anime-badge">
              {values.anime_image_url && <img src={values.anime_image_url} alt="" className="selected-anime-thumb" />}
              <div className="selected-anime-info">
                <strong>{values.anime_title}</strong>
                <small>{values.anime_id ? `ID #${values.anime_id}` : 'Asignado manualmente'}</small>
              </div>
              <button type="button" className="button ghost small" onClick={clearAnime} title="Cambiar anime">
                <Icon name="close" size={16} /> Quitar
              </button>
            </div>
          ) : (
            <div className="anime-search-container">
              <div className="anime-search-row">
                <div className="anime-input-wrap">
                  <input
                    type="search"
                    placeholder="Buscar anime (ej. Naruto, One Piece, Bleach)..."
                    value={animeQuery}
                    onChange={e => setAnimeQuery(e.target.value)}
                    autoComplete="off"
                  />
                  {searchingAnime && <span className="anime-searching-indicator">Buscando…</span>}
                </div>
                {animeQuery.trim().length >= 2 && (
                  <button type="button" className="button secondary small" onClick={assignCustomAnime} title="Usar texto ingresado como nombre del anime">
                    Usar texto
                  </button>
                )}
              </div>
              {searchFeedback && <small className="field-hint" style={{ color: '#b63445' }}>{searchFeedback}</small>}
              {animeResults.length > 0 && (
                <div className="anime-autocomplete-dropdown">
                  {animeResults.map(anime => (
                    <div key={anime.id} className="anime-autocomplete-item" onClick={() => selectAnime(anime)}>
                      {anime.image && <img src={anime.image} alt="" />}
                      <div>
                        <strong>{anime.title}</strong>
                        <small>{anime.year ? `${anime.year} • ` : ''}{anime.genres?.length ? anime.genres.slice(0, 2).join(', ') : (anime.source || 'Anime')}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <small className="field-hint">Permite filtrar los productos por anime y mostrar la card interactiva flotante con su descripción.</small>
        </div>

        <div className="form-row"><Field label="Precio (MXN)" name="price" type="number" min="0" step="0.01" required value={values.price} error={errors.price?.[0]} onChange={changeField} /><Field label="Existencias" name="stock" type="number" min="0" step="1" required value={values.stock} error={errors.stock?.[0]} onChange={changeField} /></div>
        <div className="field"><label htmlFor="product-image">Imagen del producto</label><input id="product-image" type="file" accept="image/*" aria-invalid={Boolean(errors.image)} aria-describedby={errors.image ? 'product-image-help' : 'product-image-hint'} onChange={event => { setImage(event.target.files?.[0] || null); setErrors(previous => ({ ...previous, image: undefined })); setMessage('') }} />{errors.image ? <small id="product-image-help" className="field-error">{errors.image[0]}</small> : <small id="product-image-hint" className="field-hint">{editing && product.image_path ? 'Deja el campo vacío para conservar la imagen actual.' : 'Opcional. Usa una imagen clara del producto.'}</small>}</div>
        {preview && <div className="product-form-preview"><img src={preview} alt="Vista previa del producto" onError={event => { event.currentTarget.style.display = 'none' }} /><span>{image ? 'Vista previa de la imagen seleccionada' : 'Imagen actual'}</span></div>}
        <div className="dialog-actions"><button type="button" className="button secondary" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="button primary" disabled={busy}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear producto'}<Icon name="check" /></button></div>
      </fieldset>
    </form>
  </Modal>
}
