
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FileText, Upload, Edit } from "lucide-react";

const Hero = () => {
  const features = [
    {
      icon: Upload,
      title: "Upload Resume",
      description: "Start with your existing resume or build from scratch"
    },
    {
      icon: Edit,
      title: "AI Customization",
      description: "Tailor your resume to any job description instantly"
    },
    {
      icon: FileText,
      title: "Professional Templates",
      description: "Choose from ATS-friendly, modern templates"
    }
  ];

  return (
    <section className="flex min-h-screen items-center bg-gradient-to-br from-[rgb(var(--brand-primary-rgb)/0.1)] via-[rgb(var(--brand-secondary-rgb)/0.06)] to-[rgb(var(--brand-tertiary-rgb)/0.12)]">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-headline mb-6 text-5xl font-bold text-gradient-brand md:text-6xl">
            Create Perfect Resumes with AI
          </h1>
          <p className="mb-8 text-xl leading-relaxed text-muted-foreground">
            Land your dream job with AI-powered resume customization. Tailor your resume to any job description in seconds and increase your chances of getting hired.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/builder">
              <Button size="lg" className="gradient-primary text-white border-0 hover:opacity-90 px-8 py-3 transition-all duration-300 hover:scale-105">
                Start Building
              </Button>
            </Link>
            <Link to="/templates">
              <Button
                size="lg"
                variant="outline"
                className="border-border bg-background/80 px-8 py-3 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-muted/80"
              >
                View Templates
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group cursor-pointer border-border/60 bg-card/70 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg gradient-accent transition-transform duration-300 group-hover:scale-110">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-headline mb-3 text-xl font-semibold text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
