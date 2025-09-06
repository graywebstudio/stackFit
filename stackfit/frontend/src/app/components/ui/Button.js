'use client'
import { Button as ShadcnButton } from "@/components/ui/button"
import { motion } from 'framer-motion'

export default function Button({ children, variant = 'primary', type = 'button', className = '', style = {}, ...props }) {
  // Map our variants to shadcn variants
  const variantMap = {
    primary: 'default',
    secondary: 'secondary',
    danger: 'destructive',
    success: 'success',
    ghost: 'ghost'
  }

  // Use motion.div to maintain Framer Motion animations
  return (
    <motion.div
      whileHover={{ 
        scale: props.disabled ? 1 : 1.02
      }}
      whileTap={{ scale: props.disabled ? 1 : 0.98 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.2,
        ease: 'easeInOut'
      }}
    >
      <ShadcnButton 
        type={type} 
        variant={variantMap[variant] || 'default'} 
        className={className}
        style={style}
        {...props}
      >
        {children}
      </ShadcnButton>
    </motion.div>
  )
} 