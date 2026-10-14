import { useState } from 'react'
import { errorMessage } from './api'

export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function field(name) {
    return {
      name,
      value: values[name],
      error: errors[name]?.[0],
      onChange: event => {
        setValues(previous => ({ ...previous, [name]: event.target.value }))
        setErrors(previous => ({ ...previous, [name]: undefined }))
        setMessage('')
      },
    }
  }

  async function submit(action) {
    if (busy) return false
    setBusy(true)
    setErrors({})
    setMessage('')
    try {
      await action(values)
      return true
    } catch (error) {
      setErrors(error.response?.data?.errors || {})
      setMessage(errorMessage(error))
      return false
    } finally {
      setBusy(false)
    }
  }

  return { values, setValues, errors, message, busy, field, submit }
}
