import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const PRELUDE: Msg = {
  role: "assistant",
  content: "Hi, I'm MindEase 💚 I'm here to listen.\n\n**How are you feeling today?** And on a scale of **1–10**, how would you rate your mood right now? There's no wrong answer.",
};

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([PRELUDE]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);

    if (user) {
      supabase.from("chat_logs").insert({ user_id: user.id, role: "user", content: text });
    }

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last !== PRELUDE && prev.length > next.length) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: next.filter((m) => m !== PRELUDE) }),
      });
      if (resp.status === 429) { toast.error("Too many requests — please wait a moment."); setBusy(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted."); setBusy(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buffer = line + "\n" + buffer; break;
          }
        }
      }

      if (user && assistantSoFar) {
        supabase.from("chat_logs").insert({ user_id: user.id, role: "assistant", content: assistantSoFar });
      }
    } catch (e: any) {
      toast.error("Couldn't reach the assistant. Try again.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-8 max-w-3xl">
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-display font-semibold flex items-center justify-center gap-2">
          <Sparkles className="w-7 h-7 text-primary" /> AI Chat
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Private. Empathetic. Mental-health focused only.</p>
      </div>

      <div className="glass-card flex items-start gap-3 p-4 mb-4 text-sm border-l-4 border-l-destructive/70 bg-destructive/5">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <p>If you're in crisis or thinking of harming yourself, please call <strong>14416</strong> (iCall / KIRAN) immediately. You're not alone.</p>
      </div>

      <div className="glass-card p-4 md:p-6 flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    m.role === "user"
                      ? "bg-gradient-primary text-primary-foreground rounded-br-sm"
                      : "bg-white/80 backdrop-blur border border-white/60 rounded-bl-sm"
                  }`}
                >
                  <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-strong:text-current">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {busy && (
            <div className="flex justify-start">
              <div className="bg-white/80 border border-white/60 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="mt-4 flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Share what's on your mind…"
            className="resize-none min-h-[52px] max-h-32 bg-white/70 border-white/60 rounded-2xl"
            rows={1}
          />
          <Button onClick={send} disabled={busy || !input.trim()} className="bg-gradient-primary rounded-2xl h-[52px] w-[52px] shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
