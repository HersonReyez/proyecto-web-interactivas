import ProductForm from './ProductForm'

export default function CreateProduct({ onClose, onSaved }) {
  return <ProductForm onClose={onClose} onSaved={onSaved} />
}
