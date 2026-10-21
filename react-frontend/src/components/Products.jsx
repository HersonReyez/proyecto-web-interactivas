import { useEffect, useMemo, useState } from 'react'
import { api, errorMessage, productImageUrl } from '../lib/api'
import { Icon, Loading, Notice } from './ui'
import Modal from './Modal'
import CreateProduct from './CreateProduct'
import EditProduct from './EditProduct'

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [revision, setRevision] = useState(0)
  const [editor, setEditor] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es-MX')
    if (!term) return products
    return products.filter(product => `${product.name} ${product.description}`.toLocaleLowerCase('es-MX').includes(term))
  }, [products, search])

  function saved(message) {
    setEditor(null)
    setSuccess(message)
    setRevision(value => value + 1)
  }

  async function removeProduct() {
    setDeleteBusy(true)
    setDeleteError('')
    try {
      await api.delete(`/product/${deleting.id}`)
      setDeleting(null)
      setSuccess('El producto se eliminó correctamente.')
      setRevision(value => value + 1)
    } catch (failure) {
      setDeleteError(errorMessage(failure))
    } finally {
      setDeleteBusy(false)
    }
  }

  const unitCount = products.reduce((total, product) => total + (Number(product.stock) || 0), 0)
  const unavailableCount = products.filter(product => Number(product.stock) <= 0).length

  return <>
    <div className="page-heading"><div><span className="eyebrow">EL CATÁLOGO DE ANIME STORE</span><h1>Productos<span>.</span></h1><p>Cuida cada pieza y mantén el inventario al día.</p></div><button className="button primary" onClick={() => { setSuccess(''); setEditor({ product: null }) }}><Icon name="plus" />Crear producto</button></div>
    <div className="stats-grid">
      {[['Productos', products.length, 'box', 'En el catálogo'], ['Existencias', unitCount, 'store', 'Unidades en inventario'], ['Agotados', unavailableCount, 'shield', 'Requieren reposición']].map(([label, value, icon, description]) => <div className="stat-card" key={label}><div><span>{label}</span><strong>{loading ? '—' : value}</strong><small>{description}</small></div><span className={'stat-icon ' + (icon === 'store' ? 'user' : icon === 'shield' ? 'shield' : '')}><Icon name={icon} size={24} /></span></div>)}
    </div>
    <Notice type="success">{success}</Notice>
    <section className="panel products-panel" aria-label="Listado de productos">
      <div className="table-toolbar"><div><h2>Inventario</h2><p>Administra nombres, precios, existencias e imágenes.</p></div><span className="count-label">{filteredProducts.length} {filteredProducts.length === 1 ? 'resultado' : 'resultados'}</span></div>
      <div className="filters"><div className="search-input"><Icon name="search" /><input type="search" aria-label="Buscar productos" placeholder="Buscar por nombre o descripción…" value={search} maxLength={255} onChange={event => setSearch(event.target.value)} /></div></div>
      {error ? <div className="table-state"><Notice>{error}</Notice><button className="button secondary" onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>
        : loading ? <Loading text="Cargando productos…" />
          : filteredProducts.length ? <div className="table-scroll"><table><thead><tr><th>PRODUCTO</th><th>PRECIO</th><th>EXISTENCIAS</th><th>ACTUALIZADO</th><th className="actions-heading">ACCIONES</th></tr></thead><tbody>{filteredProducts.map(product => {
            const image = productImageUrl(product.image_path)
            return <tr key={product.id}>
              <td><div className="table-user product-table-user"><span className="product-thumbnail">{image ? <img src={image} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = 'none' }} /> : <Icon name="box" size={18} />}</span><div><strong>{product.name}</strong><span>{product.description}</span></div></div></td>
              <td className="product-price-cell">{money.format(Number(product.price) || 0)}</td>
              <td><span className={'inventory-badge ' + (Number(product.stock) > 0 ? '' : 'empty')}>{product.stock} {Number(product.stock) === 1 ? 'unidad' : 'unidades'}</span></td>
              <td className="date-cell">{product.updated_at ? new Date(product.updated_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
              <td><div className="row-actions"><button className="icon-button" aria-label={'Editar ' + product.name} title="Editar producto" onClick={() => { setSuccess(''); setEditor({ product }) }}><Icon name="edit" size={18} /></button><button className="icon-button danger" aria-label={'Eliminar ' + product.name} title="Eliminar producto" onClick={() => { setDeleting(product); setDeleteError('') }}><Icon name="trash" size={18} /></button></div></td>
            </tr>
          })}</tbody></table></div>
            : <div className="empty-state"><Icon name="box" size={38} /><h3>{search ? 'No encontramos productos' : 'Aún no hay productos'}</h3><p>{search ? 'Prueba con otro nombre o descripción.' : 'Crea el primer producto para que aparezca en el catálogo público.'}</p>{search ? <button className="button secondary" onClick={() => setSearch('')}>Limpiar búsqueda</button> : <button className="button primary" onClick={() => setEditor({ product: null })}><Icon name="plus" />Crear producto</button>}</div>}
    </section>
    <p className="permission-note"><Icon name="shield" size={16} /> Solo los administradores pueden modificar el catálogo.</p>
    {editor && (editor.product ? <EditProduct product={editor.product} onClose={() => setEditor(null)} onSaved={saved} /> : <CreateProduct onClose={() => setEditor(null)} onSaved={saved} />)}
    {deleting && <Modal title="Eliminar producto" busy={deleteBusy} onClose={() => setDeleting(null)}><div className="delete-symbol"><Icon name="trash" size={26} /></div><p>Vas a eliminar <strong>{deleting.name}</strong>. Esta acción no se puede deshacer.</p><Notice>{deleteError}</Notice><div className="dialog-actions"><button className="button secondary" disabled={deleteBusy} onClick={() => setDeleting(null)}>Cancelar</button><button className="button danger-solid" disabled={deleteBusy} onClick={removeProduct}>{deleteBusy ? 'Eliminando…' : 'Eliminar producto'}</button></div></Modal>}
  </>
}
