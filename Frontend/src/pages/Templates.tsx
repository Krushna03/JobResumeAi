
import { useState } from "react";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Templates = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const navigate = useNavigate();
  const { toast } = useToast();

  const templates = [
    {
      id: 1,
      name: "Modern Professional",
      category: "Professional",
      preview: "/placeholder.svg",
      description: "Clean and modern design perfect for tech and business roles",
      tags: ["ATS-Friendly", "Modern", "Tech"]
    },
    {
      id: 2,
      name: "Classic Executive",
      category: "Executive",
      preview: "/placeholder.svg",
      description: "Traditional layout ideal for senior and executive positions",
      tags: ["Executive", "Traditional", "Corporate"]
    },
    {
      id: 3,
      name: "Creative Designer",
      category: "Creative",
      preview: "/placeholder.svg",
      description: "Visually appealing template for creative professionals",
      tags: ["Creative", "Designer", "Visual"]
    },
    {
      id: 4,
      name: "Academic Scholar",
      category: "Academic",
      preview: "/placeholder.svg",
      description: "Perfect for research positions and academic roles",
      tags: ["Academic", "Research", "Scholarly"]
    },
    {
      id: 5,
      name: "Minimalist",
      category: "Simple",
      preview: "/placeholder.svg",
      description: "Clean, minimalist design that focuses on content",
      tags: ["Minimal", "Clean", "Simple"]
    },
    {
      id: 6,
      name: "Student Fresh",
      category: "Student",
      preview: "/placeholder.svg",
      description: "Designed specifically for students and recent graduates",
      tags: ["Student", "Fresh Graduate", "Entry-level"]
    }
  ];

  const categories = ["All", "Professional", "Creative", "Academic", "Executive", "Student", "Simple"];

  const filteredTemplates = selectedCategory === "All" 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  const handlePreview = (template: any) => {
    toast({
      title: "Preview Template",
      description: `Opening preview for ${template.name}`,
    });
    console.log("Previewing template:", template);
  };

  const handleUseTemplate = (template: any) => {
    toast({
      title: "Template Selected",
      description: `${template.name} template has been applied to your resume`,
    });
    navigate("/builder", { state: { selectedTemplate: template } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Resume Templates
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from our collection of professionally designed, ATS-friendly resume templates
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === selectedCategory ? "default" : "outline"}
              size="sm"
              className={category === selectedCategory ? "gradient-primary text-white border-0" : ""}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <FileText className="w-16 h-16 text-gray-400" />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold">{template.name}</h3>
                  <Badge variant="secondary">{template.category}</Badge>
                </div>
                <p className="text-gray-600 mb-4">{template.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handlePreview(template)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 gradient-primary text-white border-0"
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No templates found</h3>
            <p className="text-gray-600">Try selecting a different category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;
