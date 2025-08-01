
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function JobsHeader() {
  const [openJobsCount, setOpenJobsCount] = useState<number>(0);
  const [activeCandidatesCount, setActiveCandidatesCount] = useState<number>(0);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const token = localStorage.getItem("token");
        // Fetch open jobs count
        const jobsRes = await fetch("/api/jobs?status=open", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        const jobsData = await jobsRes.json();
        setOpenJobsCount(Array.isArray(jobsData.data) ? jobsData.data.length : 0);

        // Fetch active candidates count
        const candidatesRes = await fetch("/api/candidates?status=active", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        const candidatesData = await candidatesRes.json();
        setActiveCandidatesCount(Array.isArray(candidatesData.data) ? candidatesData.data.length : 0);
      } catch (err) {
        setOpenJobsCount(0);
        setActiveCandidatesCount(0);
      }
    }
    fetchCounts();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Manage Jobs & Candidates</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Open Jobs</p>
                <p className="text-2xl font-semibold text-gray-800">{openJobsCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-xl font-semibold">{openJobsCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Candidates</p>
                <p className="text-2xl font-semibold text-gray-800">{activeCandidatesCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xl font-semibold">{activeCandidatesCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 