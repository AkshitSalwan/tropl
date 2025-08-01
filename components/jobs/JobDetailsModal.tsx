import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface JobDetailsModalProps {
  open: boolean;
  onClose: () => void;
  job: any | null;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ open, onClose, job }) => {
  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job Details</DialogTitle>
          
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div><strong>Job Title:</strong> {job.jobTitle}</div>
          <div><strong>City:</strong> {job.city}</div>
          <div><strong>State:</strong> {job.state}</div>
          <div><strong>Country:</strong> {job.country}</div>
          <div><strong>Department:</strong> {job.department || '-'}</div>
          <div><strong>Industry Type:</strong> {job.industryType || '-'}</div>
          <div className="md:col-span-2"><strong>Description:</strong> {job.description}</div>
          <div><strong>Experience Required:</strong> {job.experienceRequired}</div>
          <div><strong>Education UG:</strong> {job.educationUG}</div>
          <div><strong>Education PG:</strong> {job.educationPG || '-'}</div>
          <div><strong>Additional Skills:</strong> {job.additionalSkills || '-'}</div>
          <div><strong>Salary Per Annum:</strong> {job.salaryPerAnnum}</div>
          <div><strong>Key Skills:</strong> {job.keySkills}</div>
          <div><strong>Job Code:</strong> {job.jobCode}</div>
          <div><strong>Status:</strong> {job.status || 'Open'}</div>
          <div><strong>Created At:</strong> {new Date(job.createdAt).toLocaleString()}</div>
        </div>
        {/* Close button removed as requested */}
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsModal;
