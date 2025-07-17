'use client';

import { Sidebar } from "@/components/dashboard/Sidebar";
import { JobSeekersTable } from "@/components/job-seekers/JobSeekersTable";
import { JobSeekersFilters } from "@/components/job-seekers/JobSeekersFilters";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { AddResumeModal } from "@/components/job-seekers/AddResumeModal";
import { AddBulkResumesModal } from "@/components/job-seekers/AddBulkResumesModal";
import { useState } from "react";

interface FilterState {
  search: string;
  jobTitle: string;
  skills: string;
  location: string;
}

export default function JobSeekersPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    jobTitle: '',
    skills: '',
    location: '',
  });

  const [showAddResume, setShowAddResume] = useState(false);
  const [showAddBulkResumes, setShowAddBulkResumes] = useState(false);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      jobTitle: '',
      skills: '',
      location: '',
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-800">Job Seekers</h1>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowAddResume(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resume
                </Button>
                <Button
                  onClick={() => setShowAddBulkResumes(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Bulk Resumes
                </Button>
              </div>
            </div>

            <JobSeekersFilters 
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
            <JobSeekersTable filters={filters} />

            <AddResumeModal
              open={showAddResume}
              onOpenChange={setShowAddResume}
            />
            <AddBulkResumesModal
              open={showAddBulkResumes}
              onOpenChange={setShowAddBulkResumes}
            />
          </div>
        </main>
      </div>
    </div>
  );
} 