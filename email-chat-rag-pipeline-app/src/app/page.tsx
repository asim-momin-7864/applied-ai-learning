import { Suspense } from "react";
import ChatUI from "./_components/ChatUI";

export default function ChatPage() {
  return (
    <Suspense fallback={<p>Loading chat...</p>}>
      <ChatUI />
    </Suspense>
  );
}
