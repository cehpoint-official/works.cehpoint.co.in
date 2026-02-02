import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'

import { Toaster } from 'react-hot-toast'
import { UserProvider } from '../context/UserContext'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <Head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6366f1" />
      </Head>
      <Component {...pageProps} />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1f2937',
            border: '1px solid #e5e7eb',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            fontSize: '0.95rem',
            fontWeight: 500,
          },
          success: {
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
            },
            iconTheme: {
              primary: '#166534',
              secondary: '#f0fdf4',
            },
          },
          error: {
            style: {
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
            },
            iconTheme: {
              primary: '#991b1b',
              secondary: '#fef2f2',
            },
          },
        }}
        containerStyle={{
          top: 40,
        }}
      />
    </UserProvider>
  )
}

export default MyApp
