import { useEffect, useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CalendarCheck, Clock } from "lucide-react";

const SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

type Appt = { id: string; scheduled_at: string; status: string; notes: string | null };

const Booking = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slot, setSlot] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [appts, setAppts] = useState<Appt[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("appointments").select("*").eq("user_id", user.id).order("scheduled_at", { ascending: true });
    setAppts((data ?? []) as Appt[]);
  };

  useEffect(() => { load(); }, [user]);

  const book = async () => {
    if (!user) { toast.error("Please log in"); return; }
    if (!date || !slot) { toast.error("Pick a date and time"); return; }
    setBusy(true);
    const [h, m] = slot.split(":").map(Number);
    const dt = new Date(date); dt.setHours(h, m, 0, 0);
    const { error } = await supabase.from("appointments").insert({ user_id: user.id, scheduled_at: dt.toISOString(), notes: notes || null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Appointment requested 💚");
    setSlot(""); setNotes("");
    load();
  };

  return (
    <div className="container py-10 max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-semibold flex items-center justify-center gap-2">
          <CalendarCheck className="w-7 h-7 text-primary" /> Book a session
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Confidential conversations with our counsellors.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <Label className="font-display text-base mb-3 block">Pick a date</Label>
          <Calendar
            mode="single" selected={date} onSelect={setDate}
            disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
            className={cn("p-3 pointer-events-auto rounded-2xl bg-white/60")}
          />
          <Label className="font-display text-base mt-6 mb-3 block flex items-center gap-1.5"><Clock className="w-4 h-4" /> Time slot</Label>
          <div className="grid grid-cols-4 gap-2">
            {SLOTS.map((s) => (
              <button
                key={s}
                onClick={() => setSlot(s)}
                className={cn("py-2 rounded-xl text-sm border transition",
                  slot === s ? "bg-gradient-primary text-primary-foreground border-transparent" : "bg-white/60 hover:bg-white/80 border-white/60"
                )}
              >{s}</button>
            ))}
          </div>
          <div className="mt-5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything you'd like the counsellor to know" className="mt-1.5 bg-white/70 rounded-2xl" />
          </div>
          <Button onClick={book} disabled={busy} className="w-full mt-5 bg-gradient-primary rounded-xl h-11">
            {busy ? "Booking…" : "Request appointment"}
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h3 className="font-display text-xl mb-4">Your bookings</h3>
          {!user && <p className="text-sm text-muted-foreground">Log in to view your appointments.</p>}
          {user && appts.length === 0 && <p className="text-sm text-muted-foreground">No bookings yet.</p>}
          <div className="space-y-3">
            {appts.map((a) => (
              <div key={a.id} className="glass rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{format(new Date(a.scheduled_at), "PPP 'at' p")}</p>
                  {a.notes && <p className="text-xs text-muted-foreground mt-0.5">{a.notes}</p>}
                </div>
                <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium",
                  a.status === "confirmed" ? "bg-primary/10 text-primary" :
                  a.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground"
                )}>{a.status}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Booking;
