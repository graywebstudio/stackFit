import './globals.css'
import { Roboto } from 'next/font/google'
import { Toaster } from "@/components/ui/sonner"
import ClientLayout from './ClientLayout'

// Load Roboto as our main font
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${roboto.className} bg-[#0A0A0D] text-gray-100 text-sm leading-tight`}>
        <Toaster position="top-right" richColors />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
