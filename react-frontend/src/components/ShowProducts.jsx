import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api, errorMessage, productImageUrl } from '../lib/api'
import { Icon, Loading, Notice } from './ui'

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export default function ShowProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartNotice, setCartNotice] = useState(null)
  const [addingId, setAddingId] = useState(null)
  const [quantities, setQuantities] = useState({})
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    api.get('/products', { signal: controller.signal }).then(({ data }) => {
      setProducts(Array.isArray(data) ? data : [])
    }).catch(failure => {
      if (!controller.signal.aborted) setError(errorMessage(failure))
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [revision])

  async function addToCart(product) {
    const quantity = Math.max(1, Math.min(Number(product.stock) || 1, Math.floor(Number(quantities[product.id]) || 1)))
    setAddingId(product.id)
    setCartNotice(null)
    try {
      const { data } = await api.post(`/cart/${product.id}`, { quantity })
      setCartNotice({ type: 'success', text: data?.message || `${product.name} se agregó al carrito.` })
      setQuantities(previous => ({ ...previous, [product.id]: '1' }))
      setRevision(value => value + 1)
    } catch (failure) {
      setCartNotice({ type: 'error', text: failure.response?.data?.message || errorMessage(failure) })
      // Refresh the stock shown in the catalog after an insufficient-stock response.
      setRevision(value => value + 1)
    } finally {
      setAddingId(null)
    }
  }

  return <section className="catalog-section" id="productos" aria-labelledby="catalog-title">
    <div className="catalog-heading"><div><span className="eyebrow">ELIGE TU PRÓXIMA PIEZA FAVORITA</span><h2 id="catalog-title">Catálogo<span>.</span></h2><p>Figuras y coleccionables disponibles en Anime Store.</p></div><span className="count-label">{loading ? 'Cargando…' : `${products.length} ${products.length === 1 ? 'producto' : 'productos'}`}</span></div>
    {cartNotice && <Notice type={cartNotice.type}>{cartNotice.text}</Notice>}
    {error ? <div className="catalog-state"><Notice>{error}</Notice><button className="button secondary" onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>
      : loading ? <Loading text="Cargando catálogo…" />
        : products.length ? <div className="product-grid">{products.map(product => {
          const image = productImageUrl(product.image_path)
          const inStock = Number(product.stock) > 0
          return <article className="product-card" key={product.id}>
            <div className="product-card-image">
              <div className="product-art-placeholder" aria-hidden="true"><Icon name="box" size={42} /></div>
              {image && <img src={image} alt={product.name} loading="lazy" onError={event => { event.currentTarget.style.display = 'none' }} />}
              <span className={'stock-pill ' + (inStock ? '' : 'sold-out')}>{inStock ? 'Disponible' : 'Agotado'}</span>
            </div>
            <div className="product-card-copy"><div className="product-card-title"><h3>{product.name}</h3><strong>{money.format(Number(product.price) || 0)}</strong></div>
              <p>{product.description}</p><span className="product-stock-note">{inStock ? `Disponibles: ${product.stock}` : 'Sin existencias por ahora'}</span>
              {user?.role === 'cliente' && <div className="product-cart-actions">{inStock ? <><label className="cart-quantity-field">Cantidad<input type="number" min="1" max={product.stock} step="1" value={quantities[product.id] ?? '1'} aria-label={`Cantidad de ${product.name}`} onChange={event => setQuantities(previous => ({ ...previous, [product.id]: event.target.value }))} /></label><button type="button" className="button primary small" disabled={addingId === product.id} onClick={() => addToCart(product)}>{addingId === product.id ? 'Agregando…' : 'Agregar al carrito'}<Icon name="plus" size={16} /></button></> : <button type="button" className="button secondary small" disabled>Sin stock</button>}</div>}
              {!user && inStock && <Link className="product-login-link" to="/login">Inicia sesión para agregar</Link>}
            </div>
          </article>
        })}</div> : <div className="empty-state catalog-empty"><Icon name="box" size={38} /><h3>El catálogo está por comenzar</h3><p>En cuanto se agreguen productos, aparecerán aquí.</p></div>}
  </section>
}
