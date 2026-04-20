import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

const PHQ9 = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling/staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure",
  "Trouble concentrating on things",
  "Moving/speaking slowly, or being fidgety/restless",
  "Thoughts that you would be better off dead or hurting yourself",
];

const OPTS = [
  { v: 0, label: "Not at all" },
  { v: 1, label: "Several days" },
  { v: 2, label: "More than half the days" },
  { v: 3, label: "Nearly every day" },
];

function severityOf(score: number) {
  if (score <= 4) return "Minimal";
  if (score <= 9) return "Mild";
  if (score <= 14) return "Moderate";
  if (score <= 19) return "Moderately severe";
  return "Severe";
}

const Screening = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0 = mood, 1..9 = PHQ9 questions, 10 = result
  const [feeling, setFeeling] = useState("");
  const [mood, setMood] = useState(5);
  const [answers, setAnswers] = useState<number[]>(Array(9).fill(-1));
  const [done, setDone] = useState<{ score: number; sev: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const total = 11; // mood + 9 + result
  const progress = ((step + 1) / total) * 100;

  const next = async () => {
    if (step === 0 && (!feeling.trim())) { toast.error("Tell us a bit about how you're feeling"); return; }
    if (step >= 1 && step <= 9 && answers[step - 1] === -1) { toast.error("Pick an option"); return; }
    if (step === 9) {
      const score = answers.reduce((a, b) => a + b, 0);
      const sev = severityOf(score);
      setDone({ score, sev });
      setSaving(true);
      if (user) {
        const { error } = await supabase.from("screening_results").insert({
          user_id: user.id, mood, phq9_score: score, severity: sev,
          answers: { feeling, mood, phq9: answers },
        });
        if (error) toast.error("Couldn't save results");
      }
      setSaving(false);
      setStep(10);
      return;
    }
    setStep(step + 1);
  };

  const back = () => setStep(Math.max(0, step - 1));

  return (
    <div className="container py-10 max-w-2xl">
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-display font-semibold">Wellness check-in</h1>
        <p className="text-muted-foreground mt-1 text-sm">A short, private screening (PHQ-9). Takes ~3 minutes.</p>
      </div>

      <Progress value={progress} className="mb-6 h-2" />

      <div className="glass-card p-7 md:p-10">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="mood" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Label className="text-lg font-display">How are you feeling today?</Label>
              <Textarea value={feeling} onChange={(e) => setFeeling(e.target.value)} placeholder="A word or a few sentences — whatever feels right." className="mt-3 bg-white/70 min-h-[100px] rounded-2xl" />
              <div className="mt-6">
                <Label className="text-lg font-display">Rate your mood: <span className="text-primary">{mood}/10</span></Label>
                <input type="range" min={1} max={10} value={mood} onChange={(e) => setMood(Number(e.target.value))} className="w-full mt-3 accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>Low</span><span>Great</span></div>
              </div>
            </motion.div>
          )}

          {step >= 1 && step <= 9 && (
            <motion.div key={`q${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-xs text-muted-foreground mb-2">Question {step} of 9 — Over the last 2 weeks…</p>
              <h2 className="text-xl font-display mb-5">{PHQ9[step - 1]}</h2>
              <div className="grid gap-2">
                {OPTS.map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setAnswers(answers.map((a, i) => (i === step - 1 ? o.v : a)))}
                    className={`text-left px-4 py-3 rounded-xl border transition ${
                      answers[step - 1] === o.v ? "bg-gradient-primary text-primary-foreground border-transparent" : "bg-white/60 hover:bg-white/80 border-white/60"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 10 && done && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-primary text-primary-foreground grid place-items-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-display font-semibold mb-1">Thank you for sharing</h2>
              <p className="text-muted-foreground mb-6">Your results are saved privately to your account.</p>
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
                <div className="glass p-4 rounded-2xl">
                  <p className="text-xs text-muted-foreground">PHQ-9 score</p>
                  <p className="text-3xl font-display font-semibold gradient-text">{done.score}/27</p>
                </div>
                <div className="glass p-4 rounded-2xl">
                  <p className="text-xs text-muted-foreground">Severity</p>
                  <p className="text-2xl font-display font-semibold">{done.sev}</p>
                </div>
              </div>
              {done.score >= 10 && (
                <p className="text-sm text-muted-foreground mb-4">A counsellor session may help. <a href="/booking" className="text-primary font-medium">Book one →</a></p>
              )}
              <Button asChild className="bg-gradient-primary rounded-xl"><a href="/chat">Talk to MindEase</a></Button>
            </motion.div>
          )}
        </AnimatePresence>

        {step <= 9 && (
          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={back} disabled={step === 0}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
            <Button onClick={next} disabled={saving} className="bg-gradient-primary rounded-xl">
              {step === 9 ? "Finish" : "Next"} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Screening;
