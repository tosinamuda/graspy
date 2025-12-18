import { useState, useCallback } from "react";

interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface UseStudyChatReturn {
  messages: Message[];
  isGenerating: boolean;
  sendMessage: (content: string, language: string) => Promise<void>;
  clearMessages: () => void;
}

export function useStudyChat(): UseStudyChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const sendMessage = useCallback(
    async (content: string, language: string) => {
      if (!content.trim()) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        sender: "user",
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsGenerating(true);

      try {
        // Prepare history for API
        // We only send content and role (sender)
        const history = messages.map((m) => ({
          role: m.sender,
          content: m.content,
        }));

        const apiBase = (
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
        ).replace(/\/$/, "");
        const endpoint = apiBase.endsWith("/api")
          ? `${apiBase}/study/chat`
          : `${apiBase}/api/study/chat`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: content,
            language,
            history,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const data = await response.json();

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          sender: "assistant",
          content: data.answer,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          sender: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsGenerating(false);
      }
    },
    [messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isGenerating,
    sendMessage,
    clearMessages,
  };
}
