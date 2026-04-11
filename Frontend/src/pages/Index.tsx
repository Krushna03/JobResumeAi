
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const stats = [
    { label: "Resumes Created", value: "10,000+" },
    { label: "Jobs Applied", value: "25,000+" },
    { label: "Success Rate", value: "89%" },
    { label: "Happy Users", value: "5,000+" }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      content: "ResumeAI helped me land my dream job! The AI customization feature made my resume stand out.",
      avatar: "SC"
    },
    {
      name: "Michael Rodriguez",
      role: "Product Manager at Meta",
      content: "The template variety and ATS optimization features are incredible. Highly recommend!",
      avatar: "MR"
    },
    {
      name: "Emily Johnson",
      role: "UX Designer at Airbnb",
      content: "As a recent graduate, this platform made creating professional resumes so much easier.",
      avatar: "EJ"
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      
      {/* Stats Section */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="transition-transform duration-300 hover:scale-105">
                <div className="mb-2 text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-headline mb-4 text-3xl font-bold">Why Choose ResumeAI?</h2>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Our AI-powered platform gives you the edge you need in today's competitive job market
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">AI</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart AI Customization</h3>
              <p className="text-muted-foreground">Our AI analyzes job descriptions and optimizes your resume for maximum impact</p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">ATS</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">ATS-Friendly</h3>
              <p className="text-muted-foreground">All templates are optimized to pass Applicant Tracking Systems</p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 gradient-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">∞</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Unlimited Customizations</h3>
              <p className="text-muted-foreground">Create as many tailored versions as you need for different job applications</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-headline mb-4 text-3xl font-bold">Success Stories</h2>
            <p className="text-xl text-muted-foreground">See how ResumeAI helped others land their dream jobs</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary font-semibold text-primary-foreground">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
                <p className="italic text-foreground/90">&quot;{testimonial.content}&quot;</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-headline mb-4 text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who have successfully landed their dream jobs with ResumeAI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/builder">
              <Button className="rounded-lg bg-white px-8 py-3 font-semibold text-primary transition-all duration-300 hover:scale-105 hover:bg-neutral-100">
                Start Building Now
              </Button>
            </Link>
            <Link to="/templates">
              <Button variant="outline" className="rounded-lg border-2 border-white px-8 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-white hover:text-primary">
                View Templates
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
