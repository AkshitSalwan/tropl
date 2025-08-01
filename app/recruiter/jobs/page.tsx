'use client';

import { Sidebar } from "@/components/dashboard/Sidebar";
import { JobsTable } from "@/components/jobs/JobsTable";
import { JobsFilters } from "@/components/jobs/JobsFilters";
import { JobsHeader } from "@/components/jobs/JobsHeader";
import { JobsActions } from "@/components/jobs/JobsActions";

import { useEffect, useState } from "react";


export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchJobs = async (query = searchQuery) => {
    const params = new URLSearchParams();
    if (query) params.append("query", query);
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/jobs${params.toString() ? `?${params.toString()}` : ""}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    const result = await res.json();
    setJobs(Array.isArray(result.data) ? result.data : []);
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <JobsHeader />
            <div className="flex justify-between items-center">
              <JobsFilters onSearch={({ query }) => {
                setSearchQuery(query);
                fetchJobs(query);
              }} />
              <JobsActions onJobCreated={newJob => setJobs(prev => [newJob, ...prev])} />
            </div>
            <JobsTable jobs={jobs} setJobs={setJobs} />
          </div>
        </main>
      </div>
    </div>
  );
}