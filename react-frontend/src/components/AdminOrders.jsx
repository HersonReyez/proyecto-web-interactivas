import { useEffect, useMemo, useState } from 'react'
import { api, errorMessage, productImageUrl } from '../lib/api'
import { Icon, Loading, Notice } from './ui'

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [expandedOrderId, setExpandedOrderId] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    const params = new URLSearchParams()
    params.set('page', page)
    if (search.trim()) params.set('search', search.trim())
    if (statusFilter) params.set('status', statusFilter)

    api.get(`/admin/orders?${params.toString()}`, { signal: controller.signal })
      .then(({ data }) => {
        setOrders(data.orders?.data || [])
        setStats(data.stats || null)
        setMeta({
          current_page: data.orders?.current_page,
          last_page: data.orders?.last_page,
          total: data.orders?.total,
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
  }, [page, search, statusFilter])

  function toggleExpand(id) {
    setExpandedOrderId(current => (current === id ? null : id))
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TRAZABILIDAD Y REGISTRO GLOBAL</span>
          <h1>Dashboard de Ventas<span>.</span></h1>
          <p>Trazabilidad completa de todas las compras realizadas en la plataforma.</p>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <span>Ventas Totales</span>
            <strong>{stats ? money.format(stats.total_sales || 0) : '—'}</strong>
            <small>Ingresos brutos acumulados</small>
          </div>
          <span className="stat-icon"><Icon name="check" size={24} /></span>
        </div>
        <div className="stat-card">
          <div>
            <span>Pedidos Registrados</span>
            <strong>{stats ? stats.total_orders : '—'}</strong>
            <small>Transacciones completadas</small>
          </div>
          <span className="stat-icon user"><Icon name="shopping-cart" size={24} /></span>
        </div>
        <div className="stat-card">
          <div>
            <span>Artículos Vendidos</span>
            <strong>{stats ? stats.total_units_sold : '—'}</strong>
            <small>Unidades entregadas</small>
          </div>
          <span className="stat-icon"><Icon name="box" size={24} /></span>
        </div>
        <div className="stat-card">
          <div>
            <span>Compradores Únicos</span>
            <strong>{stats ? stats.unique_customers : '—'}</strong>
            <small>Clientes con compras activas</small>
          </div>
          <span className="stat-icon shield"><Icon name="users" size={24} /></span>
        </div>
      </div>

      <Notice>{error}</Notice>

      <section className="panel" aria-label="Trazabilidad de Ventas">
        <div className="table-toolbar">
          <div>
            <h2>Trazabilidad de Compras</h2>
            <p>Auditoría de pedidos por usuario, artículos adquiridos, fecha e importe.</p>
          </div>
          <span className="count-label">{meta?.total ?? 0} {meta?.total === 1 ? 'pedido' : 'pedidos'}</span>
        </div>

        <div className="filters">
          <div className="search-input">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Buscar por folio, cliente o correo…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Todos los estados</option>
            <option value="completada">Completada</option>
            <option value="pendiente">Pendiente</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        {loading ? (
          <Loading text="Cargando trazabilidad de ventas…" />
        ) : orders.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>FOLIO</th>
                  <th>CLIENTE / USUARIO</th>
                  <th>FECHA</th>
                  <th>ITEMS</th>
                  <th>TOTAL</th>
                  <th>ESTADO</th>
                  <th className="actions-heading">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
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
                    <>
                      <tr key={order.id} style={{ background: isExpanded ? '#faf9f6' : undefined }}>
                        <td><strong style={{ color: 'var(--accent)' }}>{order.order_number}</strong></td>
                        <td>
                          <div className="table-user">
                            <span className="avatar">{order.user?.name?.charAt(0) || 'U'}</span>
                            <div>
                              <strong>{order.user?.name || 'Usuario eliminado'}</strong>
                              <span>{order.user?.email || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="date-cell">{dateStr}</td>
                        <td>{order.total_items} unidades</td>
                        <td className="product-price-cell">{money.format(order.total)}</td>
                        <td>
                          <span className={`order-status-pill ${order.status}`}>
                            {order.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="button secondary small"
                            onClick={() => toggleExpand(order.id)}
                          >
                            {isExpanded ? 'Cerrar' : 'Detalles'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`expand-${order.id}`} className="expanded-order-row">
                          <td colSpan={7}>
                            <div className="admin-order-drawer">
                              <h4>Detalle de productos en la orden #{order.order_number}</h4>
                              <div className="order-items-table-wrap">
                                <table className="order-items-table">
                                  <thead>
                                    <tr>
                                      <th>PRODUCTO</th>
                                      <th>SERIE / ANIME</th>
                                      <th>PRECIO UNITARIO</th>
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
                                              <div>
                                                <strong>{item.product_name}</strong>
                                                <small style={{ color: '#888', display: 'block' }}>ID Prod: #{item.product_id || 'N/A'}</small>
                                              </div>
                                            </div>
                                          </td>
                                          <td>
                                            {item.anime_title ? (
                                              <span className="anime-genre-pill" style={{ background: '#ebe8e1', color: '#333' }}>
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
                              <div className="order-footer-details" style={{ marginTop: '12px' }}>
                                <span>Método de pago: <strong>{order.payment_method.replace('_', ' ')}</strong></span>
                                {order.notes && <span>Notas: <em>{order.notes}</em></span>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Icon name="box" size={38} />
            <h3>No se encontraron pedidos</h3>
            <p>{search ? 'Prueba con otros términos de búsqueda.' : 'Aún no se han registrado compras en la tienda.'}</p>
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div className="pagination">
            <button
              className="button secondary small"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Anterior
            </button>
            <span>Página {meta.current_page} de {meta.last_page} ({meta.total} totales)</span>
            <button
              className="button secondary small"
              disabled={page >= meta.last_page}
              onClick={() => setPage(p => p + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </section>
    </>
  )
}

