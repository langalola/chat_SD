// Realtime listeners for chat
import { RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export class ChatRealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map()

  subscribeToMessages(
    supabase: any,
    conversationId: string,
    onMessage: (payload: any) => void,
    onDelete: (payload: any) => void,
    onUpdate: (payload: any) => void
  ) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        onMessage
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        onDelete
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        onUpdate
      )
      .subscribe()

    this.channels.set(`messages:${conversationId}`, channel)
    return channel
  }

  subscribeToTypingStatus(
    supabase: any,
    conversationId: string,
    onTyping: (payload: any) => void
  ) {
    const channel = supabase
      .channel(`typing:${conversationId}`, {
        config: {
          broadcast: { self: false },
        },
      })
      .on('broadcast', { event: 'typing' }, onTyping)
      .subscribe()

    this.channels.set(`typing:${conversationId}`, channel)
    return channel
  }

  broadcastTyping(supabase: any, conversationId: string, userId: string, isTyping: boolean) {
    supabase
      .channel(`typing:${conversationId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping },
      })
  }

  unsubscribeAll() {
    this.channels.forEach((channel) => {
      channel.unsubscribe()
    })
    this.channels.clear()
  }

  unsubscribe(key: string) {
    const channel = this.channels.get(key)
    if (channel) {
      channel.unsubscribe()
      this.channels.delete(key)
    }
  }
}
