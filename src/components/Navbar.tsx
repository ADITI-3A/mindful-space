import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Brain, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const links = [
  { to: "/", label: "Home" },
  { to: "/chat", label: "AI Chat" },
  { to: "/screening", label: "Screening" },
  { to: "/booking", label: "Booking" },
  { to: "/peer", label: "Peer Support" },
  { to: "/resources", label: "Resources" },
];

export const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <nav className="container glass rounded-2xl flex items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
            <Brain className="w-5 h-5" />
          </span>
          MindEase
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/60"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" /> Sign out
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/auth">Log in</Link></Button>
              <Button size="sm" asChild className="bg-gradient-primary hover:opacity-90 shadow-elegant">
                <Link to="/auth?mode=signup">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {open && (
        <div className="container glass rounded-2xl mt-2 p-3 lg:hidden flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive ? "bg-primary/10 text-primary" : "hover:bg-white/60"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-border/60 mt-1 flex gap-2">
            {user ? (
              <Button variant="outline" size="sm" onClick={signOut} className="flex-1 gap-2">
                <LogOut className="w-4 h-4" /> Sign out
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild className="flex-1"><Link to="/auth">Log in</Link></Button>
                <Button size="sm" asChild className="flex-1 bg-gradient-primary"><Link to="/auth?mode=signup">Sign up</Link></Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
