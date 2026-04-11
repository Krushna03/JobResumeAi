import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { PageShell } from "@/components/PageShell";
import { Download } from "lucide-react";
import { useRequireAuthAction } from "@/hooks/useRequireAuthAction";
import { useToast } from "@/hooks/use-toast";

type TemplateState = { id: number; name: string; category?: string };

const Builder = () => {
  const location = useLocation();
  const { toast } = useToast();
  const requireAuth = useRequireAuthAction();
  const selectedTemplate = (location.state as { selectedTemplate?: TemplateState } | null)
    ?.selectedTemplate;
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

  const runCustomize = () => {
    setIsCustomizing(true);
    setTimeout(() => {
      setResumeData((prev) => ({
        ...prev,
        summary:
          "Results-driven Computer Science student with expertise in full-stack development and proven experience in agile software development environments.",
        skills: "JavaScript, React.js, Node.js, Python, SQL, Git, Agile Development",
      }));
      setIsCustomizing(false);
    }, 2000);
  };

  const handleCustomize = () => {
    requireAuth(runCustomize);
  };

  const handleDownloadPdf = () => {
    requireAuth(() => {
      toast({
        title: "Download started",
        description: "Your resume PDF is being prepared.",
      });
    });
  };

  return (
    <PageShell>
      <Header />

      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Resume Builder
            </h1>
            <p className="mt-2 text-muted-foreground">
              Create and customize your resume with AI assistance
            </p>
          </div>
          {selectedTemplate?.name ? (
            <Badge variant="secondary" className="w-fit shrink-0 text-sm">
              Template: {selectedTemplate.name}
            </Badge>
          ) : null}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Editor Panel */}
          <div className="space-y-6">
            <Card className="border-border bg-card/80 p-6 shadow-sm backdrop-blur-sm">
              <h2 className="mb-4 font-headline text-xl font-semibold text-foreground">Resume Information</h2>

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
            <Card className="border-border bg-card/80 p-6 shadow-sm backdrop-blur-sm">
              <h2 className="mb-4 font-headline text-xl font-semibold text-foreground">AI Resume Customization</h2>
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
                  type="button"
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
            <Card className="border-border bg-card/80 p-6 shadow-sm backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-headline text-xl font-semibold text-foreground">Resume Preview</h2>
                <Button variant="outline" size="sm" type="button" onClick={handleDownloadPdf}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
              
              {/* Resume preview: light “paper” in both themes for print-like contrast */}
              <div className="min-h-[600px] rounded-xl border border-border bg-neutral-50 p-8 text-neutral-900 shadow-inner dark:bg-card dark:text-card-foreground">
                <div className="mb-6 text-center">
                  <h3 className="font-headline text-2xl font-bold text-neutral-950 dark:text-foreground">
                    {resumeData.name}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-muted-foreground">
                    {resumeData.email} | {resumeData.phone}
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="mb-2 border-b border-neutral-200 pb-1 text-lg font-semibold text-neutral-950 dark:border-border dark:text-foreground">
                      Professional Summary
                    </h4>
                    <p className="text-sm leading-relaxed text-neutral-800 dark:text-muted-foreground">
                      {resumeData.summary}
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 border-b border-neutral-200 pb-1 text-lg font-semibold text-neutral-950 dark:border-border dark:text-foreground">
                      Experience
                    </h4>
                    <p className="text-sm text-neutral-800 dark:text-muted-foreground">{resumeData.experience}</p>
                  </div>

                  <div>
                    <h4 className="mb-2 border-b border-neutral-200 pb-1 text-lg font-semibold text-neutral-950 dark:border-border dark:text-foreground">
                      Education
                    </h4>
                    <p className="text-sm text-neutral-800 dark:text-muted-foreground">{resumeData.education}</p>
                  </div>

                  <div>
                    <h4 className="mb-2 border-b border-neutral-200 pb-1 text-lg font-semibold text-neutral-950 dark:border-border dark:text-foreground">
                      Skills
                    </h4>
                    <p className="text-sm text-neutral-800 dark:text-muted-foreground">{resumeData.skills}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Builder;
