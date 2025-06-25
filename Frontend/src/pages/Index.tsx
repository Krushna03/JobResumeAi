
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
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose ResumeAI?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform gives you the edge you need in today's competitive job market
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">AI</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart AI Customization</h3>
              <p className="text-gray-600">Our AI analyzes job descriptions and optimizes your resume for maximum impact</p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">ATS</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">ATS-Friendly</h3>
              <p className="text-gray-600">All templates are optimized to pass Applicant Tracking Systems</p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 gradient-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">∞</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Unlimited Customizations</h3>
              <p className="text-gray-600">Create as many tailored versions as you need for different job applications</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-xl text-gray-600">See how ResumeAI helped others land their dream jobs</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who have successfully landed their dream jobs with ResumeAI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/builder">
              <Button className="px-8 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105">
                Start Building Now
              </Button>
            </Link>
            <Link to="/templates">
              <Button variant="outline" className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-purple-600 transition-all duration-300 hover:scale-105">
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
