'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function ChatErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('[v0] Chat error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Algo deu errado</h2>
        <p className="text-muted-foreground mb-4">
          {error.message || 'Erro ao carregar o chat'}
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-left bg-muted p-4 rounded text-sm overflow-auto max-h-40">
            {error.stack}
          </pre>
        )}
      </div>
      <Button onClick={reset}>Tentar de novo</Button>
    </div>
  )
}
