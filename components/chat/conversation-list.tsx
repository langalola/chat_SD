'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ConversationWithDetails } from '@/lib/types/chat'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ConversationListProps {
  conversations: ConversationWithDetails[]
  selectedId: string | null
  onSelect: (conversation: ConversationWithDetails) => void
  onCreateNew: () => void
  isLoading: boolean
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onCreateNew,
  isLoading,
}: ConversationListProps) {
  return (
    <div className="w-full h-full flex flex-col bg-background border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <Button onClick={onCreateNew} className="w-full" disabled={isLoading}>
          Nova Conversa
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            Carregando...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Nenhuma conversa ainda
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedId === conv.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {conv.name || 'Conversa Direta'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.messages?.[conv.messages.length - 1]?.content ||
                        'Sem mensagens'}
                    </p>
                  </div>
                  {conv.updated_at && (
                    <p className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                      {formatDistanceToNow(new Date(conv.updated_at), {
                        locale: ptBR,
                        addSuffix: false,
                      })}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
