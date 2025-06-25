
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
    <section className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Create Perfect Resumes with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Land your dream job with AI-powered resume customization. Tailor your resume to any job description in seconds and increase your chances of getting hired.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/builder">
              <Button size="lg" className="gradient-primary text-white border-0 hover:opacity-90 px-8 py-3 transition-all duration-300 hover:scale-105">
                Start Building
              </Button>
            </Link>
            <Link to="/templates">
              <Button size="lg" variant="outline" className="px-8 py-3 hover:bg-gray-50 transition-all duration-300 hover:scale-105">
                View Templates
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 bg-white/60 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group">
                <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
