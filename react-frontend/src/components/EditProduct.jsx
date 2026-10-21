import ProductForm from './ProductForm'

export default function EditProduct({ product, onClose, onSaved }) {
  return <ProductForm product={product} onClose={onClose} onSaved={onSaved} />
}
