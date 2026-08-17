import { useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm MK AI. How can I help you today? / আমি কীভাবে আপনাকে সাহায্য করতে পারি?",
    },
  ]);

  async function sendMessage() {
    const text = input.trim();

    if (!text || loading) return;

    setMessages((old) => [
      ...old,
      { role: "user", content: text },
    ]);

    setInput("");
    setLoading(true);

    try {
      const { data, error } =
        await supabase.functions.invoke("ai-customer", {
          body: {
            message: text,
          },
        });

      if (error) throw error;

      setMessages((old) => [
        ...old,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((old) => [
        ...old,
        {
          role: "assistant",
          content:
            "Sorry, the AI assistant is temporarily unavailable.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-primary p-4 text-primary-foreground shadow-lg"
      >
        <Bot size={26} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2 font-semibold">
          <Bot size={20} />
          MK AI
        </div>

        <button onClick={() => setOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user"
                ? "ml-auto max-w-[80%] rounded-lg bg-primary p-3 text-primary-foreground"
                : "mr-auto max-w-[80%] rounded-lg bg-muted p-3"
            }
          >
            {message.content}
          </div>
        ))}

        {loading && (
          <div className="text-sm text-muted-foreground">
            AI is typing...
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="Ask me something..."
          className="flex-1 rounded-md border px-3"
        />

        <button
          onClick={sendMessage}
          className="rounded-md bg-primary p-3 text-primary-foreground"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}