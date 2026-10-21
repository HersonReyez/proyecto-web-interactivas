import { useEffect, useState } from 'react'
import { api, errorMessage, productImageUrl } from '../lib/api'
import { Field, Icon, Notice } from './ui'
import Modal from './Modal'

export default function ProductForm({ product = null, onClose, onSaved }) {
  const [values, setValues] = useState(() => ({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price != null ? Number(product.price).toFixed(2) : '',
    stock: product?.stock ?? '',
  }))
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(productImageUrl(product?.image_path))
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const editing = Boolean(product)

  useEffect(() => {
    if (!image) {
      setPreview(productImageUrl(product?.image_path))
      return undefined
    }
    const objectUrl = URL.createObjectURL(image)
    setPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [image, product?.image_path])

  function changeField(event) {
    const { name, value } = event.target
    setValues(previous => ({ ...previous, [name]: value }))
    setErrors(previous => ({ ...previous, [name]: undefined }))
    setMessage('')
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
    if (image) payload.append('image', image)

    try {
      if (editing) {
        // The copied Laravel controller reads the product id from the request body.
        payload.append('id', product.id)
        // Method spoofing lets Laravel parse an uploaded file on the update request.
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
    <p className="dialog-description">{editing ? 'Actualiza la información y el inventario del producto.' : 'Agrega una pieza nueva al catálogo de Anime Store.'}</p>
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <Notice>{message}</Notice>
        <Field label="Nombre del producto" name="name" autoComplete="off" required maxLength={255} value={values.name} error={errors.name?.[0]} onChange={changeField} />
        <div className="field"><label htmlFor="product-description">Descripción</label><textarea id="product-description" name="description" required maxLength={255} rows={4} value={values.description} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'product-description-help' : undefined} onChange={changeField} />{errors.description && <small id="product-description-help" className="field-error">{errors.description[0]}</small>}</div>
        <div className="form-row"><Field label="Precio (MXN)" name="price" type="number" min="0" step="0.01" required value={values.price} error={errors.price?.[0]} onChange={changeField} /><Field label="Existencias" name="stock" type="number" min="0" step="1" required value={values.stock} error={errors.stock?.[0]} onChange={changeField} /></div>
        <div className="field"><label htmlFor="product-image">Imagen del producto</label><input id="product-image" type="file" accept="image/*" aria-invalid={Boolean(errors.image)} aria-describedby={errors.image ? 'product-image-help' : 'product-image-hint'} onChange={event => { setImage(event.target.files?.[0] || null); setErrors(previous => ({ ...previous, image: undefined })); setMessage('') }} />{errors.image ? <small id="product-image-help" className="field-error">{errors.image[0]}</small> : <small id="product-image-hint" className="field-hint">{editing && product.image_path ? 'Deja el campo vacío para conservar la imagen actual.' : 'Opcional. Usa una imagen clara del producto.'}</small>}</div>
        {preview && <div className="product-form-preview"><img src={preview} alt="Vista previa del producto" onError={event => { event.currentTarget.style.display = 'none' }} /><span>{image ? 'Vista previa de la imagen seleccionada' : 'Imagen actual'}</span></div>}
        <div className="dialog-actions"><button type="button" className="button secondary" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="button primary" disabled={busy}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear producto'}<Icon name="check" /></button></div>
      </fieldset>
    </form>
  </Modal>
}
