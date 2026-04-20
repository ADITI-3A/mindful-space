import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Users, CalendarCheck, BookOpen, BarChart3, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-meditation.jpg";

const features = [
  { icon: MessageCircle, title: "AI Chat Support", desc: "Talk through what's on your mind with a private, judgment-free companion trained on mental wellness." },
  { icon: CalendarCheck, title: "Confidential Booking", desc: "Schedule sessions with counsellors. Your information stays private, always." },
  { icon: Users, title: "Peer Support", desc: "Anonymous community spaces to share, listen, and feel less alone in your journey." },
  { icon: BookOpen, title: "Resource Hub", desc: "Curated meditations, guided videos, and evidence-based articles for everyday wellbeing." },
  { icon: BarChart3, title: "Progress Tracking", desc: "PHQ-9 screening and mood logs help you see patterns and celebrate growth." },
  { icon: ShieldCheck, title: "Privacy First", desc: "End-to-end protection. You control what you share and what stays yours." },
];

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] },
});

const Index = () => {
  return (
    <div>
      {/* Hero */}
      <section className="container pt-12 lg:pt-20 pb-16 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="absolute top-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-secondary/40 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />

        <div className="relative grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fade(0)}>
            <span className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-xs font-medium text-primary mb-6">
              <Sparkles className="w-3.5 h-3.5" /> A safer way to feel better
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-semibold leading-[1.05] mb-6">
              Your safe space for <span className="gradient-text">mental wellness</span>.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
              MindEase combines compassionate AI conversations, evidence-based screening, and human connection — all in one private, calm place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 shadow-elegant rounded-2xl h-12 px-6 text-base">
                <Link to="/chat">Chat with AI <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-2xl h-12 px-6 text-base bg-white/60 backdrop-blur border-white/60 hover:bg-white/80">
                <Link to="/peer">Join Chat Rooms</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div><strong className="text-foreground">10k+</strong> conversations</div>
              <div className="w-px h-4 bg-border" />
              <div><strong className="text-foreground">100%</strong> private</div>
              <div className="w-px h-4 bg-border" />
              <div><strong className="text-foreground">24/7</strong> support</div>
            </div>
          </motion.div>

          <motion.div {...fade(1)} className="relative">
            <div className="glass-card p-3 rotate-1">
              <img src={hero} alt="Person meditating in calm space" className="rounded-2xl w-full aspect-[5/4] object-cover" />
            </div>
            <motion.div
              initial={{ opacity: 0, x: -20, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute -bottom-6 -left-6 glass-card p-4 max-w-[220px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 grid place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Right now</p>
                  <p className="text-sm font-medium">"You're not alone."</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <motion.div {...fade(0)} className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-display font-semibold mb-4">Everything you need, gently.</h2>
          <p className="text-muted-foreground text-lg">Tools and people designed to meet you where you are.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title} {...fade(i)} className="glass-card p-7">
              <div className="w-12 h-12 rounded-2xl bg-gradient-soft grid place-items-center mb-4 text-primary">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="container py-16">
        <motion.div {...fade(0)} className="glass-card p-10 md:p-16 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-semibold mb-4">
            Healing isn't a straight line. <br />
            <span className="gradient-text">Take the next gentle step.</span>
          </h2>
          <p className="text-muted-foreground mb-7 max-w-xl mx-auto">
            Whether it's a 2-minute mood check-in or an hour-long conversation, every small step matters.
          </p>
          <Button asChild size="lg" className="bg-gradient-primary shadow-elegant rounded-2xl h-12 px-7">
            <Link to="/screening">Start a check-in</Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
