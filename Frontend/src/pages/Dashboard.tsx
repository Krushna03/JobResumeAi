
import { useState } from "react";
import Header from "@/components/Header";
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
      case "Applied": return "bg-blue-100 text-blue-800";
      case "In Review": return "bg-yellow-100 text-yellow-800";
      case "Interview": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Resume Dashboard</h1>
            <p className="text-gray-600">Manage your tailored resumes and track applications</p>
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
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-2xl font-bold text-primary mb-1">12</div>
            <div className="text-sm text-gray-600">Total Resumes</div>
          </Card>
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-2xl font-bold text-green-600 mb-1">4</div>
            <div className="text-sm text-gray-600">Applications Sent</div>
          </Card>
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-2xl font-bold text-blue-600 mb-1">2</div>
            <div className="text-sm text-gray-600">Interviews</div>
          </Card>
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-2xl font-bold text-purple-600 mb-1">89%</div>
            <div className="text-sm text-gray-600">Avg. Match Score</div>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
            <Card key={resume.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{resume.title}</h3>
                    <Badge className={getStatusColor(resume.status)}>
                      {resume.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
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
                    <div className="text-xs text-gray-500">Match</div>
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
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No resumes found</h3>
            <p className="text-gray-600 mb-4">
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
    </div>
  );
};

export default Dashboard;
