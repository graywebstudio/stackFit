'use client'
import { Input as ShadcnInput } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Input({
  label,
  type = 'text',
  error,
  className = '',
  labelStyle = {},
  ...props
}) {
  return (
    <div className="w-full space-y-2">
      {label && (
        <Label 
          className="text-sm font-medium text-gray-300" 
          style={labelStyle}
          htmlFor={props.id || props.name}
        >
          {label}
        </Label>
      )}
      <ShadcnInput
        type={type}
        id={props.id || props.name}
        className={`w-full 
          ${error ? 'border-red-500' : ''}
          ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
} 