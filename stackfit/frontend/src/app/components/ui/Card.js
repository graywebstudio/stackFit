'use client'
import {
  Card as ShadcnCard,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"

export default function Card({ children, className = '', title, description, header, footer, contentClassName = '' }) {
  // If simple usage with just children, render a basic card with content
  if (!title && !description && !header && !footer) {
    return (
      <ShadcnCard className={className}>
        <CardContent className={`${contentClassName} ${!contentClassName.includes('pt-') ? 'pt-6' : ''}`}>
          {children}
        </CardContent>
      </ShadcnCard>
    )
  }

  // Advanced usage with structured parts
  return (
    <ShadcnCard className={className}>
      {(header || title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          {header}
        </CardHeader>
      )}
      <CardContent className={contentClassName}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter>
          {footer}
        </CardFooter>
      )}
    </ShadcnCard>
  )
} 