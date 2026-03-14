import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'DocuQuery - Team Document AI',
    description: 'Ask questions about your team documents using AI',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                {children}
                <Toaster
                    position="top-right"
                    richColors
                    closeButton
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.75rem',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        },
                        className: 'font-medium',
                    }}
                />
            </body>
        </html>
    )
}