
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import { Upload, FileText, Download } from "lucide-react";

const Builder = () => {
  const [resumeData, setResumeData] = useState({
    name: "John Doe",
    email: "john.doe@email.com",
    phone: "+1 (555) 123-4567",
    summary: "Motivated Computer Science student with strong programming skills and passion for software development.",
    experience: "Software Development Intern at Tech Corp (2023-2024)",
    education: "Bachelor of Science in Computer Science - State University (2021-2025)",
    skills: "JavaScript, React, Node.js, Python, SQL"
  });

  const [jobDescription, setJobDescription] = useState("");
  const [isCustomizing, setIsCustomizing] = useState(false);

  const handleCustomize = async () => {
    setIsCustomizing(true);
    // Simulate AI processing
    setTimeout(() => {
      setResumeData(prev => ({
        ...prev,
        summary: "Results-driven Computer Science student with expertise in full-stack development and proven experience in agile software development environments.",
        skills: "JavaScript, React.js, Node.js, Python, SQL, Git, Agile Development"
      }));
      setIsCustomizing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Resume Builder</h1>
          <p className="text-gray-600">Create and customize your resume with AI assistance</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Editor Panel */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Resume Information</h2>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={resumeData.name}
                      onChange={(e) => setResumeData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={resumeData.email}
                      onChange={(e) => setResumeData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={resumeData.phone}
                      onChange={(e) => setResumeData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="summary">Professional Summary</Label>
                    <Textarea
                      id="summary"
                      value={resumeData.summary}
                      onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                      rows={4}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="experience" className="space-y-4">
                  <div>
                    <Label htmlFor="experience">Work Experience</Label>
                    <Textarea
                      id="experience"
                      value={resumeData.experience}
                      onChange={(e) => setResumeData(prev => ({ ...prev, experience: e.target.value }))}
                      rows={6}
                      placeholder="Add your work experience..."
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="education" className="space-y-4">
                  <div>
                    <Label htmlFor="education">Education</Label>
                    <Textarea
                      id="education"
                      value={resumeData.education}
                      onChange={(e) => setResumeData(prev => ({ ...prev, education: e.target.value }))}
                      rows={4}
                      placeholder="Add your education details..."
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="skills" className="space-y-4">
                  <div>
                    <Label htmlFor="skills">Skills</Label>
                    <Textarea
                      id="skills"
                      value={resumeData.skills}
                      onChange={(e) => setResumeData(prev => ({ ...prev, skills: e.target.value }))}
                      rows={4}
                      placeholder="List your skills..."
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* AI Customization Panel */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">AI Resume Customization</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="job-description">Paste Job Description</Label>
                  <Textarea
                    id="job-description"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here to customize your resume..."
                    rows={6}
                  />
                </div>
                <Button 
                  onClick={handleCustomize}
                  disabled={!jobDescription || isCustomizing}
                  className="w-full gradient-primary text-white border-0"
                >
                  {isCustomizing ? "Customizing..." : "Customize Resume with AI"}
                </Button>
              </div>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Resume Preview</h2>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
              
              {/* Resume Preview */}
              <div className="bg-white p-8 shadow-lg min-h-[600px] border">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">{resumeData.name}</h1>
                  <p className="text-gray-600">{resumeData.email} | {resumeData.phone}</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-2">
                      Professional Summary
                    </h2>
                    <p className="text-gray-700 text-sm leading-relaxed">{resumeData.summary}</p>
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-2">
                      Experience
                    </h2>
                    <p className="text-gray-700 text-sm">{resumeData.experience}</p>
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-2">
                      Education
                    </h2>
                    <p className="text-gray-700 text-sm">{resumeData.education}</p>
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-2">
                      Skills
                    </h2>
                    <p className="text-gray-700 text-sm">{resumeData.skills}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Builder;
