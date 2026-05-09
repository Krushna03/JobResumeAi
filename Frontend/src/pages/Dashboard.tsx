import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Download,
  Eye,
  Search,
  Plus,
  Filter,
  Loader2,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { apiJson, getApiBase, getStoredToken } from "@/lib/api";

type ResumeListItem = {
  id: string;
  jobTitle: string;
  jobDescriptionPreview: string;
  generatedFileName: string;
  generatedFileSize: number;
  originalFileName: string;
  createdAt: string;
  updatedAt: string;
};

type ListMyResumesResponse = {
  success: boolean;
  count: number;
  items: ResumeListItem[];
};

function formatDate(value: string): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return value;
  }
}

function formatBytes(size: number): string {
  if (!size) return "";
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await apiJson<ListMyResumesResponse>("/api/v1/resume/mine");
        if (!cancelled) setResumes(data.items ?? []);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load resumes";
        setLoadError(msg);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredResumes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return resumes;
    return resumes.filter(
      (r) =>
        r.jobTitle.toLowerCase().includes(q) ||
        r.jobDescriptionPreview.toLowerCase().includes(q) ||
        r.originalFileName.toLowerCase().includes(q),
    );
  }, [resumes, searchTerm]);

  const handleCreateNew = () => {
    navigate("/tailor");
  };

  const handleOpen = (resumeId: string) => {
    navigate(`/resume-preview/${resumeId}`);
  };

  const handleDownload = async (resume: ResumeListItem) => {
    setDownloadingId(resume.id);
    try {
      const headers = new Headers();
      const token = getStoredToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const res = await fetch(
        `${getApiBase()}/api/v1/resume/${resume.id}/pdf`,
        { headers, credentials: "include" },
      );
      if (!res.ok) throw new Error("Could not download this resume.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = resume.generatedFileName || `tailored-resume-${resume.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({
        title: "Download failed",
        description: e instanceof Error ? e.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (resume: ResumeListItem) => {
    if (!confirm(`Delete "${resume.jobTitle}"? This can't be undone.`)) return;
    setDeletingId(resume.id);
    try {
      await apiJson(`/api/v1/resume/${resume.id}`, { method: "DELETE" });
      setResumes((prev) => prev.filter((r) => r.id !== resume.id));
      toast({ title: "Resume deleted" });
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const totalCount = resumes.length;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Resume Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Every tailored resume you've generated, ready to revisit or download.
            </p>
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
            <div className="mb-1 text-2xl font-bold text-primary">
              {isLoading ? "—" : totalCount}
            </div>
            <div className="text-sm text-muted-foreground">Total Resumes</div>
          </Card>
          <Card className="border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {isLoading
                ? "—"
                : resumes.filter((r) => {
                    const today = new Date();
                    const created = new Date(r.createdAt);
                    return (
                      created.getFullYear() === today.getFullYear() &&
                      created.getMonth() === today.getMonth()
                    );
                  }).length}
            </div>
            <div className="text-sm text-muted-foreground">This Month</div>
          </Card>
          <Card className="border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-1 text-2xl font-bold text-primary">
              {isLoading
                ? "—"
                : resumes.filter((r) => r.originalFileName).length}
            </div>
            <div className="text-sm text-muted-foreground">With Original</div>
          </Card>
          <Card className="border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-1 text-2xl font-bold text-brand-tertiary">
              {isLoading
                ? "—"
                : formatBytes(
                    resumes.reduce((sum, r) => sum + (r.generatedFileSize || 0), 0),
                  ) || "0 KB"}
            </div>
            <div className="text-sm text-muted-foreground">Total Size</div>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6 border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by job title, description, or file name…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <Filter className="w-4 h-4 mr-1" />
                Date Range
              </Button>
            </div>
          </div>
        </Card>

        {/* Resumes List */}
        {isLoading ? (
          <Card className="border-border bg-card p-12 text-center shadow-sm">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading your resumes…</p>
          </Card>
        ) : loadError ? (
          <Card className="border-border bg-card p-12 text-center shadow-sm">
            <FileText className="mx-auto mb-4 h-12 w-12 text-destructive/60" />
            <h3 className="font-headline text-xl font-semibold text-foreground">
              Couldn't load your resumes
            </h3>
            <p className="mt-2 text-muted-foreground">{loadError}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredResumes.map((resume) => (
              <Card
                key={resume.id}
                className="border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleOpen(resume.id)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-headline text-lg font-semibold text-foreground">
                        {resume.jobTitle}
                      </h3>
                      <Badge className="bg-primary/15 text-primary">Generated</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{formatDate(resume.createdAt)}</span>
                      {resume.originalFileName ? (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-xs">
                            {resume.originalFileName}
                          </span>
                        </>
                      ) : null}
                      {resume.generatedFileSize ? (
                        <>
                          <span>•</span>
                          <span>{formatBytes(resume.generatedFileSize)}</span>
                        </>
                      ) : null}
                    </div>
                    {resume.jobDescriptionPreview ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground/80">
                        {resume.jobDescriptionPreview}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpen(resume.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Open
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(resume)}
                      disabled={downloadingId === resume.id}
                    >
                      {downloadingId === resume.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-1" />
                      )}
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(resume)}
                      disabled={deletingId === resume.id}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete resume"
                    >
                      {deletingId === resume.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !loadError && filteredResumes.length === 0 && (
          <Card className="border-border bg-card p-12 text-center shadow-sm">
            <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="font-headline text-xl font-semibold text-foreground">
              {searchTerm
                ? "No resumes match your search"
                : "No resumes yet"}
            </h3>
            <p className="mb-4 mt-2 text-muted-foreground">
              {searchTerm
                ? "Try a different search term."
                : "Create your first tailored resume to see it here."}
            </p>
            {!searchTerm && (
              <Button
                className="gradient-primary text-white border-0"
                onClick={handleCreateNew}
              >
                Create Your First Resume
              </Button>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
