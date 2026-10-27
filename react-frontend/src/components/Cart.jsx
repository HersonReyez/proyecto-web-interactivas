import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage, productImageUrl } from '../lib/api'
import { Icon, Loading, Notice } from './ui'

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function itemQuantity(item) {
  return Number(item.quantity ?? item.pivot?.quantity ?? 1)
}

export default function Cart() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [removingId, setRemovingId] = useState(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    api.get('/cart', { signal: controller.signal }).then(({ data }) => {
      setItems(Array.isArray(data) ? data : [])
    }).catch(failure => {
      if (!controller.signal.aborted) setError(failure.response?.data?.message || errorMessage(failure))
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [revision])

  const totals = useMemo(() => items.reduce((sum, item) => {
    const quantity = itemQuantity(item)
    return { units: sum.units + quantity, amount: sum.amount + (Number(item.price) || 0) * quantity }
  }, { units: 0, amount: 0 }), [items])

  async function removeItem(item) {
    setRemovingId(item.id)
    setError('')
    setNotice('')
    try {
      const { data } = await api.delete(`/cart/${item.id}`)
      setItems(current => current.filter(currentItem => currentItem.id !== item.id))
      setNotice(data?.message || 'El producto se eliminó del carrito y el stock fue restaurado.')
    } catch (failure) {
      setError(failure.response?.data?.message || errorMessage(failure))
    } finally {
      setRemovingId(null)
    }
  }

  return <>
    <div className="page-heading"><div><span className="eyebrow">TUS PRODUCTOS SELECCIONADOS</span><h1>Mi carrito<span>.</span></h1><p>Revisa tus productos antes de continuar.</p></div><Link className="button secondary" to="/#productos"><Icon name="store" />Seguir comprando</Link></div>
    <Notice type="success">{notice}</Notice>
    <Notice>{error}</Notice>
    {loading ? <Loading text="Cargando tu carrito…" /> : items.length ? <div className="cart-layout">
      <section className="panel cart-items-panel" aria-label="Productos en el carrito">
        <div className="table-toolbar"><div><h2>Productos</h2><p>Quita un producto para devolver sus unidades al inventario.</p></div><span className="count-label">{totals.units} {totals.units === 1 ? 'unidad' : 'unidades'}</span></div>
        <div className="cart-items">{items.map(item => {
          const quantity = itemQuantity(item)
          const image = productImageUrl(item.image_path)
          return <article className="cart-item" key={item.id}>
            <div className="cart-item-image"><span className="product-art-placeholder"><Icon name="box" size={28} /></span>{image && <img src={image} alt={item.name} loading="lazy" onError={event => { event.currentTarget.style.display = 'none' }} />}</div>
            <div className="cart-item-info"><h3>{item.name}</h3><p>{item.description}</p><div className="cart-item-meta"><span>{quantity} {quantity === 1 ? 'unidad' : 'unidades'}</span><strong>{money.format(Number(item.price) || 0)} c/u</strong></div></div>
            <div className="cart-item-total"><strong>{money.format((Number(item.price) || 0) * quantity)}</strong><button type="button" className="icon-button danger" aria-label={'Quitar ' + item.name + ' del carrito'} title="Quitar del carrito" disabled={removingId === item.id} onClick={() => removeItem(item)}><Icon name="trash" size={18} /></button></div>
          </article>
        })}</div>
      </section>
      <aside className="panel cart-summary"><span className="eyebrow">RESUMEN</span><h2>Tu selección</h2><div><span>Productos</span><strong>{items.length}</strong></div><div><span>Unidades</span><strong>{totals.units}</strong></div><div className="cart-total-row"><span>Total</span><strong>{money.format(totals.amount)}</strong></div><p>El stock se reserva al agregar productos al carrito.</p><Link className="button primary full" to="/#productos">Volver al catálogo<Icon name="arrow" /></Link></aside>
    </div> : <section className="panel cart-empty empty-state"><Icon name="shopping-cart" size={42} /><h3>Tu carrito está vacío</h3><p>Explora el catálogo y agrega los productos que te gusten.</p><Link className="button primary" to="/#productos"><Icon name="store" />Ver catálogo</Link></section>}
  </>
}
