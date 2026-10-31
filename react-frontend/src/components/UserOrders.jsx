import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage, productImageUrl } from '../lib/api'
import { Icon, Loading, Notice } from './ui'

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export default function UserOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [expandedOrderId, setExpandedOrderId] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    api.get(`/my-orders?page=${page}`, { signal: controller.signal })
      .then(({ data }) => {
        setOrders(data.data || [])
        setMeta({
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total,
        })
      })
      .catch(failure => {
        if (!controller.signal.aborted) {
          setError(failure.response?.data?.message || errorMessage(failure))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [page])

  function toggleExpand(id) {
    setExpandedOrderId(current => (current === id ? null : id))
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TU HISTORIAL DE PEDIDOS</span>
          <h1>Mis compras<span>.</span></h1>
          <p>Trazabilidad y detalles de todas tus compras realizadas.</p>
        </div>
        <Link className="button secondary" to="/#productos">
          <Icon name="store" /> Ver catálogo
        </Link>
      </div>

      <Notice>{error}</Notice>

      {loading ? (
        <Loading text="Cargando tu historial de compras…" />
      ) : orders.length ? (
        <div className="orders-container">
          <div className="orders-list">
            {orders.map(order => {
              const isExpanded = expandedOrderId === order.id
              const dateStr = new Date(order.created_at).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <article key={order.id} className="panel order-card">
                  <div className="order-header" onClick={() => toggleExpand(order.id)}>
                    <div className="order-info-block">
                      <span className="order-number">{order.order_number}</span>
                      <span className="order-date">{dateStr}</span>
                    </div>

                    <div className="order-meta-group">
                      <span className="order-status-pill completada">
                        <Icon name="check" size={14} /> {order.status.toUpperCase()}
                      </span>
                      <div className="order-price-summary">
                        <span>Total:</span>
                        <strong>{money.format(order.total)}</strong>
                        <small>({order.total_items} {order.total_items === 1 ? 'artículo' : 'artículos'})</small>
                      </div>
                      <button
                        type="button"
                        className="button ghost small"
                        aria-label="Ver detalles"
                      >
                        {isExpanded ? 'Ocultar' : 'Ver detalle'} <Icon name="arrow" size={14} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="order-details-drawer">
                      <div className="order-items-table-wrap">
                        <table className="order-items-table">
                          <thead>
                            <tr>
                              <th>PRODUCTO</th>
                              <th>SERIE / ANIME</th>
                              <th>PRECIO</th>
                              <th>CANTIDAD</th>
                              <th style={{ textAlign: 'right' }}>SUBTOTAL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items?.map(item => {
                              const img = productImageUrl(item.image_path)
                              return (
                                <tr key={item.id}>
                                  <td>
                                    <div className="order-item-cell">
                                      <div className="order-item-thumb">
                                        {img ? <img src={img} alt="" /> : <Icon name="box" size={16} />}
                                      </div>
                                      <strong>{item.product_name}</strong>
                                    </div>
                                  </td>
                                  <td>
                                    {item.anime_title ? (
                                      <span className="anime-genre-pill" style={{ background: '#f0ece5', color: '#555' }}>
                                        {item.anime_title}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#aaa' }}>—</span>
                                    )}
                                  </td>
                                  <td>{money.format(item.price)}</td>
                                  <td>{item.quantity}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                    {money.format(item.subtotal)}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="order-footer-details">
                        <span>Método de pago: <strong>{order.payment_method.replace('_', ' ')}</strong></span>
                        {order.notes && <span>Notas: <em>{order.notes}</em></span>}
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>

          {meta && meta.last_page > 1 && (
            <div className="pagination">
              <button
                className="button secondary small"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Anterior
              </button>
              <span>Página {meta.current_page} de {meta.last_page}</span>
              <button
                className="button secondary small"
                disabled={page >= meta.last_page}
                onClick={() => setPage(p => p + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="box" size={42} />
          <h3>Aún no has realizado compras</h3>
          <p>Tus compras completadas aparecerán aquí con su comprobante y fecha de compra.</p>
          <Link className="button primary" to="/#productos">
            <Icon name="store" /> Explorar catálogo
          </Link>
        </div>
      )}
    </>
  )
}

