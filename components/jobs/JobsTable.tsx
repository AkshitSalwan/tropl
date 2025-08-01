import { MoreVertical, Trash2, Loader2, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import JobDetailsModal from "./JobDetailsModal";
import { CreateJobModal } from "./CreateJobModal";

export function JobsTable({ jobs, setJobs }: { jobs: any[]; setJobs: (fn: (prev: any[]) => any[]) => void }) {
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh jobs from API
  const refreshJobs = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/jobs", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const result = await res.json();
      if (Array.isArray(result.data)) {
        setJobs(() => result.data);
      }
    } catch (err) {
      alert("Failed to refresh jobs");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="flex justify-end p-2">
          <Button variant="outline" size="sm" onClick={refreshJobs} disabled={refreshing} className="flex items-center gap-2">
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Code</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Location</TableHead>
              
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No jobs found
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.jobCode}</TableCell>
                  <TableCell>{job.jobTitle || job.title}</TableCell>
                  <TableCell>{job.city || job.state || job.country ? [job.city, job.state, job.country].filter(Boolean).join(", ") : job.location}</TableCell>
                  
                  <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedJob(job); setDetailsOpen(true); }}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedJob(job); setEditOpen(true); }}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => setDeleteJobId(job.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <JobDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} job={selectedJob} />
      <CreateJobModal 
        open={editOpen} 
        onOpenChange={setEditOpen} 
        initialJob={selectedJob} 
        mode="edit"
        onJobUpdated={(updatedJob) => {
          setJobs((prev) => prev.map((job) => job.id === updatedJob.id ? updatedJob : job));
        }}
        onJobCreated={(newJob) => {
          setJobs((prev) => [newJob, ...prev]);
        }}
      />
      <AlertDialog open={!!deleteJobId} onOpenChange={(open) => { if (!open) setDeleteJobId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={async () => {
                if (!deleteJobId) return;
                setDeleting(true);
                try {
                  const token = localStorage.getItem("token");
                  const res = await fetch(`/api/jobs/${deleteJobId}`, {
                    method: "DELETE",
                    headers: {
                      Authorization: token ? `Bearer ${token}` : "",
                    },
                  });
                  if (res.ok) {
                    setJobs((prev) => prev.filter((j) => j.id !== deleteJobId));
                  } else {
                    alert("Failed to delete job");
                  }
                } catch (err) {
                  alert("Error deleting job");
                } finally {
                  setDeleting(false);
                  setDeleteJobId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}