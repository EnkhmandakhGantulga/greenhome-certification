import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Leaf, CheckCircle2, Building2, FileCheck, Home } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-md fixed w-full z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="font-display font-bold text-xl tracking-tight">
              Green<span className="text-primary">Home</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/api/login">
              <Button variant="default" className="font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                Sign In / Register
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-5xl sm:text-6xl font-display font-bold leading-tight text-foreground">
              Sustainable <br />
              <span className="text-primary">Building</span> <br />
              <span className="text-gradient">Certification</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              Get your green building projects certified. Submit requests, work with expert auditors, and receive your eco-certification seamlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/api/login">
                <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-xl hover:-translate-y-1 transition-all duration-300">
                  Get Started
                </Button>
              </a>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl border-2">
                Learn More
              </Button>
            </div>
            
            <div className="pt-8 flex items-center gap-6 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Eco-Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>LEED Compatible</span>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in delay-200 lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900 flex items-center justify-center">
            {/* Abstract visual representation */}
            <div className="relative w-full h-full p-8 flex flex-col gap-6">
              <div className="absolute top-10 right-10 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-border/50 w-64 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Green Certificate Issued</div>
                    <div className="text-xs text-muted-foreground">Just now</div>
                  </div>
                </div>
                <div className="h-2 bg-emerald-100 rounded-full w-full mb-2"></div>
                <div className="h-2 bg-emerald-100 rounded-full w-2/3"></div>
              </div>

              <div className="absolute bottom-20 left-10 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-border/50 w-72 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Home className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Eco-Home Project</div>
                    <div className="text-xs text-muted-foreground">Under Review</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <div className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">Sustainable</div>
                  <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Energy Efficient</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Submit Your Project", desc: "Easy forms for green building project submission", icon: FileText },
              { title: "Expert Green Audit", desc: "Qualified auditors review your sustainability documentation", icon: Leaf },
              { title: "Get Eco-Certified", desc: "Receive your official green building certificate", icon: CheckCircle2 },
            ].map((feature, i) => (
              <div key={i} className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}
