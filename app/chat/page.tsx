import { ChatContainer } from '@/components/chat/chat-container'

export default function ChatPage() {
  return (
    <div className="flex-1 w-full flex flex-col h-full bg-background p-4">
      <div className="flex-1">
        <ChatContainer />
      </div>
    </div>
  )
}
