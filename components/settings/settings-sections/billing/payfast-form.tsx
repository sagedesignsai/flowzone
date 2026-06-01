"use client"

import { useEffect, useRef } from "react"

export interface PayFastFormData {
  action: string
  fields: Record<string, string>
}

export function PayFastForm({
  formData,
  onSubmitted,
}: {
  formData: PayFastFormData | null
  onSubmitted: () => void
}) {
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (formData && formRef.current) {
      formRef.current.submit()
      onSubmitted()
    }
  }, [formData, onSubmitted])

  if (!formData) return null

  return (
    <form
      ref={formRef}
      action={formData.action}
      method="POST"
      className="hidden"
    >
      {Object.entries(formData.fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
    </form>
  )
}
