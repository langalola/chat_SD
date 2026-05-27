import { ChatContainer } from '@/components/chat/chat-container'

export default function ChatPage() {
  return (
    <div className="flex-1 w-full flex flex-col h-full bg-background p-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Chat</h1>
        <p className="text-muted-foreground">Conversas individuais e em grupo</p>
      </div>
      <div className="flex-1">
        <ChatContainer />
      </div>
    </div>
  )
}
