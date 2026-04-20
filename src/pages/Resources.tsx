import { motion } from "framer-motion";
import { BookOpen, Headphones, Video, Wind, Heart, Brain } from "lucide-react";

const RESOURCES = [
  { icon: Wind, type: "Meditation", title: "5-min breathing reset", desc: "A quick box-breathing practice to calm your nervous system.", url: "https://www.youtube.com/watch?v=tEmt1Znux58", color: "from-teal-100 to-cyan-100" },
  { icon: Headphones, type: "Audio", title: "Sleep stories", desc: "Drift off with calming narrations and ambient soundscapes.", url: "https://www.calm.com/", color: "from-indigo-100 to-purple-100" },
  { icon: Video, type: "Video", title: "Understanding anxiety", desc: "TED-Ed: how anxiety works and gentle ways to manage it.", url: "https://www.youtube.com/watch?v=BBVqEEy5cwQ", color: "from-orange-100 to-rose-100" },
  { icon: BookOpen, type: "Guide", title: "Journaling prompts", desc: "30 thoughtful prompts to explore feelings and patterns.", url: "https://positivepsychology.com/journaling-for-mental-health/", color: "from-emerald-100 to-teal-100" },
  { icon: Heart, type: "Self-care", title: "Building a routine", desc: "Small daily habits proven to support emotional wellbeing.", url: "https://www.mind.org.uk/information-support/tips-for-everyday-living/", color: "from-pink-100 to-rose-100" },
  { icon: Brain, type: "Article", title: "CBT basics", desc: "Cognitive Behavioural Therapy techniques you can practice today.", url: "https://www.nhs.uk/mental-health/talking-therapies-medicine-treatments/talking-therapies-and-counselling/cognitive-behavioural-therapy-cbt/", color: "from-violet-100 to-fuchsia-100" },
];

const Resources = () => (
  <div className="container py-10 max-w-6xl">
    <div className="text-center mb-10">
      <h1 className="text-3xl md:text-4xl font-display font-semibold">Resource Hub</h1>
      <p className="text-muted-foreground mt-1">Curated, evidence-informed tools to support your journey.</p>
    </div>

    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {RESOURCES.map((r, i) => (
        <motion.a
          key={r.title} href={r.url} target="_blank" rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06, duration: 0.5 }}
          className="glass-card p-6 block group"
        >
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${r.color} grid place-items-center mb-4 text-foreground/70`}>
            <r.icon className="w-6 h-6" />
          </div>
          <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">{r.type}</p>
          <h3 className="text-lg font-display font-semibold mb-1.5 group-hover:gradient-text transition-all">{r.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
        </motion.a>
      ))}
    </div>
  </div>
);

export default Resources;
