import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage, productImageUrl } from '../lib/api'
import { Icon, Loading, Notice } from './ui'
import Modal from './Modal'

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function itemQuantity(item) {
  return Number(item.quantity ?? item.pivot?.quantity ?? 1)
}

function withQuantity(item, quantity) {
  if (item.quantity !== undefined) return { ...item, quantity }
  return { ...item, pivot: { ...item.pivot, quantity } }
}

export default function Cart() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [removingId, setRemovingId] = useState(null)
  const [decrementingId, setDecrementingId] = useState(null)

  // Estados de checkout / simulación de compra
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutModal, setCheckoutModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('tarjeta_simulada')
  const [notes, setNotes] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(null)

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
  }, [])

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

  async function removeOne(item) {
    setDecrementingId(item.id)
    setError('')
    setNotice('')
    try {
      const { data } = await api.delete(`/cart/${item.id}/unit`)
      const nextQuantity = Number(data?.remaining_quantity ?? Math.max(0, itemQuantity(item) - 1))
      if (nextQuantity <= 0) {
        setItems(current => current.filter(currentItem => currentItem.id !== item.id))
      } else {
        setItems(current => current.map(currentItem => currentItem.id === item.id
          ? withQuantity(currentItem, nextQuantity)
          : currentItem))
      }
      setNotice(data?.message || 'Se quitó una unidad y se restauró el stock.')
    } catch (failure) {
      setError(failure.response?.data?.message || errorMessage(failure))
    } finally {
      setDecrementingId(null)
    }
  }

  async function handleSimulatePurchase(event) {
    event.preventDefault()
    setCheckingOut(true)
    setError('')
    try {
      const { data } = await api.post('/checkout', {
        payment_method: paymentMethod,
        notes: notes.trim() || 'Compra simulada en línea',
      })
      setItems([])
      setCheckoutModal(false)
      setOrderSuccess(data?.order || true)
      setNotice('¡Compra simulada completada con éxito! Tu pedido ha sido registrado en el sistema.')
    } catch (failure) {
      setError(failure.response?.data?.message || errorMessage(failure))
    } finally {
      setCheckingOut(false)
    }
  }

  return <>
    <div className="page-heading">
      <div>
        <span className="eyebrow">TUS PRODUCTOS SELECCIONADOS</span>
        <h1>Mi carrito<span>.</span></h1>
        <p>Revisa tus productos y finaliza tu compra.</p>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Link className="button secondary" to="/mis-compras"><Icon name="box" />Mis compras</Link>
        <Link className="button secondary" to="/#productos"><Icon name="store" />Seguir comprando</Link>
      </div>
    </div>

    <Notice type="success">{notice}</Notice>
    <Notice>{error}</Notice>

    {orderSuccess && (
      <div className="order-success-card">
        <div className="order-success-header">
          <span className="order-success-icon"><Icon name="check" size={32} /></span>
          <div>
            <h3>¡Gracias por tu compra!</h3>
            <p>Se ha generado el folio de orden <strong>{orderSuccess.order_number}</strong> con un total de <strong>{money.format(orderSuccess.total)}</strong>.</p>
          </div>
        </div>
        <div className="order-success-actions">
          <Link className="button primary" to="/mis-compras">Ver mi historial de compras <Icon name="arrow" /></Link>
          <Link className="button secondary" to="/#productos">Volver al catálogo</Link>
        </div>
      </div>
    )}

    {loading ? <Loading text="Cargando tu carrito…" /> : items.length ? <div className="cart-layout">
      <section className="panel cart-items-panel" aria-label="Productos en el carrito">
        <div className="table-toolbar"><div><h2>Productos</h2><p>Usa − para devolver una unidad o la papelera para quitar toda la línea.</p></div><span className="count-label">{totals.units} {totals.units === 1 ? 'unidad' : 'unidades'}</span></div>
        <div className="cart-items">{items.map(item => {
          const quantity = itemQuantity(item)
          const image = productImageUrl(item.image_path)
          return <article className="cart-item" key={item.id}>
            <div className="cart-item-image"><span className="product-art-placeholder"><Icon name="box" size={28} /></span>{image && <img src={image} alt={item.name} loading="lazy" onError={event => { event.currentTarget.style.display = 'none' }} />}</div>
            <div className="cart-item-info">
              <h3>{item.name}</h3>
              {item.anime_title && <span className="item-anime-tag">{item.anime_title}</span>}
              <p>{item.description}</p>
              <div className="cart-item-meta"><span>{quantity} {quantity === 1 ? 'unidad' : 'unidades'}</span><strong>{money.format(Number(item.price) || 0)} c/u</strong></div>
            </div>
            <div className="cart-item-total">
              <strong>{money.format((Number(item.price) || 0) * quantity)}</strong>
              <div className="cart-item-actions">
                <button type="button" className="icon-button" aria-label={'Quitar una unidad de ' + item.name} title="Quitar una unidad" disabled={removingId === item.id || decrementingId === item.id} onClick={() => removeOne(item)}><Icon name="minus" size={18} /></button>
                <button type="button" className="icon-button danger" aria-label={'Quitar todas las unidades de ' + item.name} title="Quitar toda la línea" disabled={removingId === item.id || decrementingId === item.id} onClick={() => removeItem(item)}><Icon name="trash" size={18} /></button>
              </div>
            </div>
          </article>
        })}</div>
      </section>
      <aside className="panel cart-summary">
        <span className="eyebrow">RESUMEN</span>
        <h2>Tu selección</h2>
        <div><span>Productos</span><strong>{items.length}</strong></div>
        <div><span>Unidades</span><strong>{totals.units}</strong></div>
        <div className="cart-total-row"><span>Total</span><strong>{money.format(totals.amount)}</strong></div>
        <p>El stock se encuentra reservado. Puedes proceder con la simulación de pago.</p>
        <button type="button" className="button primary full" onClick={() => setCheckoutModal(true)}>
          <Icon name="check" /> Finalizar compra (Simulada)
        </button>
        <Link className="button secondary full" to="/#productos">Seguir explorando</Link>
      </aside>
    </div> : !orderSuccess && <section className="panel cart-empty empty-state"><Icon name="shopping-cart" size={42} /><h3>Tu carrito está vacío</h3><p>Explora el catálogo y agrega los productos que te gusten.</p><Link className="button primary" to="/#productos"><Icon name="store" />Ver catálogo</Link></section>}

    {/* Modal de simulación de compra */}
    {checkoutModal && (
      <Modal title="Confirmar compra simulada" onClose={() => setCheckoutModal(false)} busy={checkingOut}>
        <p className="dialog-description">Esta acción confirmará tu pedido en el sistema, generará el número de orden y registrará la compra en tu historial.</p>
        <form onSubmit={handleSimulatePurchase}>
          <fieldset disabled={checkingOut}>
            <div className="field">
              <label htmlFor="payment-method">Método de pago simulado</label>
              <select id="payment-method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="tarjeta_simulada">💳 Tarjeta de crédito/débito (Simulada)</option>
                <option value="transferencia">🏦 Transferencia electrónica SPEI (Simulada)</option>
                <option value="oxxo_pay">🏪 Pago en OXXO (Simulado)</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="checkout-notes">Notas o instrucciones de entrega</label>
              <textarea
                id="checkout-notes"
                rows={2}
                placeholder="Ej. Entregar en recepción o con portero..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="checkout-summary-mini">
              <div><span>Total de artículos:</span> <strong>{totals.units} unidades</strong></div>
              <div><span>Monto a pagar:</span> <strong>{money.format(totals.amount)}</strong></div>
            </div>

            <div className="dialog-actions">
              <button type="button" className="button secondary" disabled={checkingOut} onClick={() => setCheckoutModal(false)}>Cancelar</button>
              <button type="submit" className="button primary" disabled={checkingOut}>
                {checkingOut ? 'Procesando pago…' : 'Confirmar y pagar'} <Icon name="check" />
              </button>
            </div>
          </fieldset>
        </form>
      </Modal>
    )}
  </>
}
