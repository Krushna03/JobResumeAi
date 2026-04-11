import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Download, Edit, Search, Plus, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const navigate = useNavigate();
  const { toast } = useToast();

  const savedResumes = [
    {
      id: 1,
      title: "Software Engineer - Google",
      company: "Google",
      date: "2024-01-15",
      status: "Applied",
      matchPercentage: 92,
      template: "Modern Professional"
    },
    {
      id: 2,
      title: "Frontend Developer - Meta",
      company: "Meta",
      date: "2024-01-12",
      status: "In Review",
      matchPercentage: 88,
      template: "Minimalist"
    },
    {
      id: 3,
      title: "Full Stack Developer - Stripe",
      company: "Stripe",
      date: "2024-01-10",
      status: "Interview",
      matchPercentage: 95,
      template: "Modern Professional"
    },
    {
      id: 4,
      title: "React Developer - Airbnb",
      company: "Airbnb",
      date: "2024-01-08",
      status: "Rejected",
      matchPercentage: 85,
      template: "Creative Designer"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Applied":
        return "bg-primary/15 text-primary";
      case "In Review":
        return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
      case "Interview":
        return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";
      case "Rejected":
        return "bg-destructive/15 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (percentage >= 80) return "text-primary";
    if (percentage >= 70) return "text-amber-600 dark:text-amber-400";
    return "text-destructive";
  };

  const filteredResumes = savedResumes.filter(resume => {
    const matchesSearch = resume.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resume.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All Status" || resume.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateNew = () => {
    navigate("/builder");
  };

  const handleEdit = (resumeId: number) => {
    toast({
      title: "Opening Editor",
      description: `Loading resume ${resumeId} for editing`,
    });
    navigate("/builder", { state: { resumeId } });
  };

  const handleDownload = (resume: any) => {
    toast({
      title: "Download Started",
      description: `Downloading ${resume.title} as PDF`,
    });
    console.log("Downloading resume:", resume);
  };

  const statusOptions = ["All Status", "Applied", "In Review", "Interview", "Rejected"];

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Resume Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">Manage your tailored resumes and track applications</p>
          </div>
          <Button 
            className="gradient-primary text-white border-0"
            onClick={handleCreateNew}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Resume
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <Card className="border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-1 text-2xl font-bold text-primary">12</div>
            <div className="text-sm text-muted-foreground">Total Resumes</div>
          </Card>
          <Card className="border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">4</div>
            <div className="text-sm text-muted-foreground">Applications Sent</div>
          </Card>
          <Card className="border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-1 text-2xl font-bold text-primary">2</div>
            <div className="text-sm text-muted-foreground">Interviews</div>
          </Card>
          <Card className="border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-1 text-2xl font-bold text-brand-tertiary">89%</div>
            <div className="text-sm text-muted-foreground">Avg. Match Score</div>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by job title or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-1" />
                Date Range
              </Button>
              <Button variant="outline" size="sm">
                Template
              </Button>
            </div>
          </div>
        </Card>

        {/* Resumes List */}
        <div className="space-y-4">
          {filteredResumes.map((resume) => (
            <Card key={resume.id} className="border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-headline text-lg font-semibold text-foreground">{resume.title}</h3>
                    <Badge className={getStatusColor(resume.status)}>
                      {resume.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{resume.company}</span>
                    <span>•</span>
                    <span>{resume.date}</span>
                    <span>•</span>
                    <span>{resume.template}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getMatchColor(resume.matchPercentage)}`}>
                      {resume.matchPercentage}%
                    </div>
                    <div className="text-xs text-muted-foreground">Match</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(resume.id)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownload(resume)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredResumes.length === 0 && (
          <Card className="border-border bg-card p-12 text-center shadow-sm">
            <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="font-headline text-xl font-semibold text-foreground">No resumes found</h3>
            <p className="mb-4 mt-2 text-muted-foreground">
              {searchTerm ? "Try adjusting your search terms" : "Create your first resume to get started"}
            </p>
            <Button 
              className="gradient-primary text-white border-0"
              onClick={handleCreateNew}
            >
              Create Your First Resume
            </Button>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
