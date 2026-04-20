import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Post = { id: string; user_id: string; author_name: string; content: string; created_at: string };

const Peer = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [authorName, setAuthorName] = useState<string>("Friend");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("forum_posts").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setPosts((data ?? []) as Post[]));

    const ch = supabase.channel("forum_posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forum_posts" },
        (p) => setPosts((prev) => [p.new as Post, ...prev]))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "forum_posts" },
        (p) => setPosts((prev) => prev.filter((x) => x.id !== (p.old as Post).id)))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.display_name) setAuthorName(data.display_name); });
  }, [user]);

  const post = async () => {
    if (!user) { toast.error("Please log in to post"); return; }
    const text = draft.trim();
    if (!text) return;
    if (text.length > 1000) { toast.error("Keep it under 1000 characters"); return; }
    setBusy(true);
    const { error } = await supabase.from("forum_posts").insert({ user_id: user.id, author_name: authorName, content: text });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDraft("");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("forum_posts").delete().eq("id", id);
    if (error) toast.error(error.message);
  };

  return (
    <div className="container py-10 max-w-2xl">
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-display font-semibold flex items-center justify-center gap-2">
          <Users className="w-7 h-7 text-primary" /> Peer Support
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">A kind community. Be respectful, anonymous, and supportive.</p>
      </div>

      <div className="glass-card p-5 mb-6">
        <Textarea
          value={draft} onChange={(e) => setDraft(e.target.value)}
          placeholder={user ? "Share what's on your mind…" : "Log in to post"}
          disabled={!user} maxLength={1000}
          className="bg-white/70 border-white/60 rounded-2xl min-h-[80px]"
        />
        <div className="flex justify-between items-center mt-3">
          <span className="text-xs text-muted-foreground">{draft.length}/1000</span>
          <Button onClick={post} disabled={!user || busy || !draft.trim()} className="bg-gradient-primary rounded-xl">Post</Button>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {posts.map((p) => (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center font-display font-semibold">
                    {p.author_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.author_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
                {user?.id === p.user_id && (
                  <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive p-1.5"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        {posts.length === 0 && <p className="text-center text-muted-foreground py-12">Be the first to share.</p>}
      </div>
    </div>
  );
};

export default Peer;
