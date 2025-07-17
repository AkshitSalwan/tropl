import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MessageSquare, Eye, Pencil, Calendar as CalendarIcon, Trash2, CheckSquare, Square, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { format, addDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import { AddResumeModal } from "./AddResumeModal";

interface JobSeeker {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  skills: string[];
  selectedSkills: string[];
  location: string;
  city: string;
  state: string;
  country: string;
  experience: string;
  expectedSalary: string;
  currentSalary: string;
  noticePeriod: string;
  relocate: string;
  dob?: string;
  gender?: string;
  linkedin?: string;
  github?: string;
  summary?: string;
  aadhaar?: string;
  pan?: string;
  uan?: string;
  experiences?: any[];
  education?: any[];
  user: {
    id: string;
    email: string;
    phone: string;
    name: string;
    avatar?: string;
  };
  _count: {
    applications: number;
    interviews: number;
  };
}

interface FilterState {
  search: string;
  jobTitle: string;
  skills: string;
  location: string;
}

interface JobSeekersTableProps {
  filters: FilterState;
}

export function JobSeekersTable({ filters }: JobSeekersTableProps) {
  const { token, isLoading: authLoading } = useAuth();
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareType, setShareType] = useState<string[]>([]);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(addDays(new Date(), 7));
  const [maxVisit, setMaxVisit] = useState("7");
  const [expiryPopoverOpen, setExpiryPopoverOpen] = useState(false);
  const [shareTypeOpen, setShareTypeOpen] = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [jobCategory, setJobCategory] = useState("all");
  const [jobStatus, setJobStatus] = useState("all");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewCandidateOpen, setViewCandidateOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<JobSeeker | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<JobSeeker | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editCandidateOpen, setEditCandidateOpen] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState<JobSeeker | null>(null);

  // Function to manually refresh data
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Function to open candidate details modal
  const handleViewCandidate = (candidate: JobSeeker) => {
    setSelectedCandidate(candidate);
    setViewCandidateOpen(true);
  };

  // Function to initiate candidate deletion
  const handleDeleteCandidate = (candidate: JobSeeker) => {
    setCandidateToDelete(candidate);
    setDeleteConfirmOpen(true);
  };

  // Function to confirm and execute deletion
  const confirmDeleteCandidate = async () => {
    if (!candidateToDelete || !token) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/candidates/${candidateToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Remove the deleted candidate from the local state
        setJobSeekers(prev => prev.filter(candidate => candidate.id !== candidateToDelete.id));
        
        // Show success message
        setError(null);
        
        // Close the confirmation dialog
        setDeleteConfirmOpen(false);
        setCandidateToDelete(null);

        // Refresh the data to ensure consistency
        refreshData();
      } else {
        throw new Error(result.error || 'Failed to delete candidate');
      }
    } catch (error) {
      console.error('Delete candidate error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete candidate');
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to cancel deletion
  const cancelDeleteCandidate = () => {
    setDeleteConfirmOpen(false);
    setCandidateToDelete(null);
  };

  // Function to initiate candidate editing
  const handleEditCandidate = (candidate: JobSeeker) => {
    setCandidateToEdit(candidate);
    setEditCandidateOpen(true);
  };

  // Function to cancel editing
  const cancelEditCandidate = () => {
    setEditCandidateOpen(false);
    setCandidateToEdit(null);
  };

  // Fetch candidates from API
  useEffect(() => {
    const fetchCandidates = async () => {
      // Wait for auth context to finish loading
      if (authLoading) {
        return;
      }

      if (!token) {
        setError('Please log in to view candidates');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Build query parameters for filtering
        const queryParams = new URLSearchParams();
        
        // Combine search filters into a single query parameter
        const searchTerms = [filters.search, filters.jobTitle, filters.skills, filters.location]
          .filter(term => term.trim() !== '')
          .join(' ');
        
        if (searchTerms) {
          queryParams.append('query', searchTerms);
        }
        
        // Add specific filters
        if (filters.location.trim()) {
          queryParams.append('filters[location]', filters.location);
        }

        const url = `/api/candidates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch candidates');
        }

        const result = await response.json();
        if (result.success && result.data) {
          setJobSeekers(result.data);
          setError(null); // Clear any previous errors
        } else {
          throw new Error(result.error || 'Failed to fetch candidates');
        }
      } catch (error) {
        console.error('Error fetching candidates:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch candidates');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [token, filters, authLoading, refreshTrigger]); // Re-fetch when refresh is triggered

  const allSelected = selectedIds.length === jobSeekers.length && jobSeekers.length > 0;
  const anySelected = selectedIds.length > 0;
  const selectedCandidates = jobSeekers.filter((j: JobSeeker) => selectedIds.includes(j.id));

  const sampleJobs = [
    { id: 1, title: "Senior Manager", client: "MARUTI", status: "OPEN", category: "Management" },
    { id: 2, title: "Associate", client: "Aditya Birla", status: "OPEN", category: "Operations" },
    { id: 3, title: "Lead Engineer", client: "Tata Motors", status: "OPEN", category: "Engineering" },
    { id: 4, title: "Business Analyst", client: "Infosys", status: "OPEN", category: "Analysis" },
  ];
  const filteredJobs = sampleJobs.filter(j =>
    (!jobSearch || j.title.toLowerCase().includes(jobSearch.toLowerCase())) &&
    (jobCategory === "all" || j.category === jobCategory) &&
    (jobStatus === "all" || j.status === jobStatus)
  );

  const handleSelectAll = () => {
    setSelectedIds(allSelected ? [] : jobSeekers.map((j: JobSeeker) => j.id));
  };
  const handleSelect = (id: string) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };

  // Helper function to format location
  const formatLocation = (candidate: JobSeeker) => {
    const parts = [];
    if (candidate.city) parts.push(candidate.city);
    if (candidate.state) parts.push(candidate.state);
    if (candidate.country && candidate.country !== 'India') parts.push(candidate.country);
    return parts.length > 0 ? parts.join(', ') : candidate.location || 'Not specified';
  };

  // Helper function to get candidate name
  const getCandidateName = (candidate: JobSeeker) => {
    if (candidate.firstName || candidate.lastName) {
      return `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim();
    }
    return candidate.user?.name || 'Unknown';
  };

  // Helper function to get candidate email
  const getCandidateEmail = (candidate: JobSeeker) => {
    return candidate.email || candidate.user?.email || 'No email';
  };

  // Helper function to get candidate phone
  const getCandidatePhone = (candidate: JobSeeker) => {
    return candidate.phone || candidate.user?.phone || 'No phone';
  };

  // Helper function to get candidate skills
  const getCandidateSkills = (candidate: JobSeeker) => {
    if (candidate.selectedSkills && candidate.selectedSkills.length > 0) {
      return candidate.selectedSkills;
    }
    if (candidate.skills && candidate.skills.length > 0) {
      return candidate.skills;
    }
    return [];
  };

  if (authLoading || loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">
            {authLoading ? 'Authenticating...' : 'Loading candidates...'}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button 
            onClick={refreshData}
            className="mt-4"
            variant="outline"
            disabled={authLoading}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (jobSeekers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">
            {Object.values(filters).some(f => f.trim() !== '') 
              ? 'No candidates match your search criteria' 
              : 'No candidates found'
            }
          </p>
          <p className="text-sm mb-4">
            {Object.values(filters).some(f => f.trim() !== '') 
              ? 'Try adjusting your search filters or clearing them to see all candidates.' 
              : 'There are no candidates in the database yet.'
            }
          </p>
          {Object.values(filters).some(f => f.trim() !== '') && (
            <Button 
              onClick={() => {
                // Clear filters and refresh
                Object.keys(filters).forEach(key => {
                  filters[key as keyof typeof filters] = '';
                });
                refreshData();
              }}
              variant="outline"
              className="mr-2"
              disabled={authLoading || loading}
            >
              Clear Filters & Refresh
            </Button>
          )}
          <Button 
            onClick={refreshData}
            variant="outline"
            disabled={authLoading || loading}
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
      {/* Table header with count and refresh */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="text-sm text-gray-600">
          {jobSeekers.length} candidate{jobSeekers.length !== 1 ? 's' : ''} found
          {Object.values(filters).some(f => f.trim() !== '') && (
            <span className="ml-2 text-blue-600">(filtered)</span>
          )}
        </div>
        <Button 
          onClick={refreshData}
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
          disabled={authLoading || loading}
        >
          <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {anySelected && (
        <div className="flex gap-2 mb-2">
          <Button size="sm" variant="outline" onClick={() => setShareOpen(true)} className="bg-orange-50 hover:bg-orange-100">Share Candidate</Button>
          <Button size="sm" variant="outline" className="bg-orange-50 hover:bg-orange-100">Send Job Invitation</Button>
          <Button size="sm" variant="outline" onClick={() => setPipelineOpen(true)} className="bg-orange-50 hover:bg-orange-100">Job Pipeline</Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <button onClick={handleSelectAll} aria-label="Select all">
                {allSelected ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-gray-400" />}
              </button>
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Job Title</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Skills</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobSeekers.map((seeker: JobSeeker) => (
            <TableRow key={seeker.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(seeker.id)}
                  onChange={() => handleSelect(seeker.id)}
                  className="accent-primary h-4 w-4"
                  aria-label={`Select ${getCandidateName(seeker)}`}
                />
              </TableCell>
              <TableCell>
                <div className="font-medium">{getCandidateName(seeker)}</div>
              </TableCell>
              <TableCell>{seeker.jobTitle || 'Not specified'}</TableCell>
              <TableCell>
                <div>{getCandidateEmail(seeker)}</div>
                <div className="text-sm text-gray-500">{getCandidatePhone(seeker)}</div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {getCandidateSkills(seeker).slice(0, 2).map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                  {getCandidateSkills(seeker).length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      +{getCandidateSkills(seeker).length - 2} more
                    </span>
                  )}
                  {getCandidateSkills(seeker).length === 0 && (
                    <span className="text-sm text-gray-400">No skills listed</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatLocation(seeker)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleViewCandidate(seeker)}
                    title="View candidate details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleEditCandidate(seeker)}
                    title="Edit candidate"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteCandidate(seeker)}
                    title="Delete candidate"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Share Candidate Modal */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Candidate</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Email<span className="text-red-500">*</span></label>
                <Input required value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="Enter email address" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Share type<span className="text-red-500">*</span></label>
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex justify-between"
                    onClick={() => setShareTypeOpen((open) => !open)}
                  >
                    <span>
                      {shareType.length === 0
                        ? "Select Sharing Option"
                        : shareType.join(", ")}
                    </span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </Button>
                  {shareTypeOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow">
                      {['resume', 'video interview', 'rating', 'ai score', 'feedback'].map(option => (
                        <label key={option} className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={shareType.includes(option)}
                            onChange={() => {
                              setShareType(prev =>
                                prev.includes(option)
                                  ? prev.filter(o => o !== option)
                                  : [...prev, option]
                              );
                            }}
                            className="mr-2 accent-primary"
                          />
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">Link Expiry Date<span className="text-red-500">*</span></label>
                <Popover open={expiryPopoverOpen} onOpenChange={setExpiryPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Input
                      readOnly
                      value={expiryDate ? format(expiryDate, 'yyyy-MM-dd') : ''}
                      onClick={() => setExpiryPopoverOpen(true)}
                      placeholder="Select date"
                      className="cursor-pointer"
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={date => { setExpiryDate(date); setExpiryPopoverOpen(false); }}
                      className="border rounded-md"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="block mb-1 font-medium">Max Visit<span className="text-red-500">*</span></label>
                <Input type="number" min={1} value={maxVisit} onChange={e => setMaxVisit(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="mb-2 font-semibold">Selected Candidates Preview:</div>
              <div className="flex flex-wrap gap-4 mb-2">
                {selectedCandidates.map((c: JobSeeker) => (
                  <div key={c.id} className="border rounded p-2 min-w-[200px]">
                    <div className="font-bold">{getCandidateName(c)}</div>
                    <div className="text-xs text-gray-600">{getCandidateEmail(c)}</div>
                    <div className="text-xs text-gray-600">{getCandidatePhone(c)}</div>
                    <div className="text-xs text-gray-600">
                      {c.jobTitle || 'No job title'}
                    </div>
                    <div className="text-xs text-gray-600">
                      Exp: {c.experience || 'Not specified'} years
                    </div>
                    <div className="text-xs text-gray-600">
                      Location: {formatLocation(c)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                By clicking submit you will be sharing all selected Candidates with the {shareEmail || "[email]"} and share type: {shareType.length > 0 ? shareType.join(", ") : "[type]"}.
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button type="submit">Submit</Button>
              <Button type="button" variant="outline" onClick={() => setShareOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Job Pipeline Modal */}
      <Dialog open={pipelineOpen} onOpenChange={setPipelineOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Job Pipeline</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {/* Search section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search job title"
                value={jobSearch}
                onChange={e => setJobSearch(e.target.value)}
              />
              <Select value={jobCategory} onValueChange={setJobCategory}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Analysis">Analysis</SelectItem>
                </SelectContent>
              </Select>
              <Select value={jobStatus} onValueChange={setJobStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="OPEN">OPEN</SelectItem>
                  <SelectItem value="CLOSED">CLOSED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Job listings table */}
            <div className="overflow-x-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <input
                          type="radio"
                          name="selectedJob"
                          checked={selectedJobId === job.id}
                          onChange={() => setSelectedJobId(job.id)}
                          className="accent-primary"
                        />
                      </TableCell>
                      <TableCell>{job.title}</TableCell>
                      <TableCell>{job.client}</TableCell>
                      <TableCell>{job.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Selected candidate preview */}
            <div>
              <div className="mb-2 font-semibold">Selected Candidates:</div>
              <div className="flex flex-wrap gap-4 mb-2">
                {selectedCandidates.map((c: JobSeeker) => (
                  <div key={c.id} className="border rounded p-2 min-w-[200px]">
                    <div className="font-bold">{getCandidateName(c)}</div>
                    <div className="text-xs text-gray-600">{getCandidateEmail(c)}</div>
                    <div className="text-xs text-gray-600">{getCandidatePhone(c)}</div>
                    <div className="text-xs text-gray-600">
                      {c.jobTitle || 'No job title'}
                    </div>
                    <div className="text-xs text-gray-600">
                      Exp: {c.experience || 'Not specified'} years
                    </div>
                    <div className="text-xs text-gray-600">
                      Location: {formatLocation(c)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {selectedJobId && (
              <div className="text-sm text-gray-600 italic">
                By clicking submit, you will add the above selected candidates to the job pipeline.
              </div>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <Button type="submit">Submit</Button>
              <Button type="button" variant="outline" onClick={() => setPipelineOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Candidate Details Modal */}
      <Dialog open={viewCandidateOpen} onOpenChange={setViewCandidateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Candidate Details
            </DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Personal Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-sm text-gray-900">{getCandidateName(selectedCandidate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-sm text-gray-900">{getCandidateEmail(selectedCandidate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-sm text-gray-900">{getCandidatePhone(selectedCandidate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                    <p className="text-sm text-gray-900">{selectedCandidate.dob || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Gender</label>
                    <p className="text-sm text-gray-900">{selectedCandidate.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p className="text-sm text-gray-900">{formatLocation(selectedCandidate)}</p>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Professional Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Job Title</label>
                    <p className="text-sm text-gray-900">{selectedCandidate.jobTitle || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Experience</label>
                    <p className="text-sm text-gray-900">
                      {selectedCandidate.experience ? `${selectedCandidate.experience} years` : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Notice Period</label>
                    <p className="text-sm text-gray-900">{selectedCandidate.noticePeriod || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current Salary</label>
                    <p className="text-sm text-gray-900">
                      {selectedCandidate.currentSalary ? `₹${selectedCandidate.currentSalary}` : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Expected Salary</label>
                    <p className="text-sm text-gray-900">
                      {selectedCandidate.expectedSalary ? `₹${selectedCandidate.expectedSalary}` : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Open to Relocation</label>
                    <p className="text-sm text-gray-900">{selectedCandidate.relocate || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Contact & Social */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Contact & Social Links</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">LinkedIn</label>
                    <p className="text-sm text-gray-900">
                      {selectedCandidate.linkedin ? (
                        <a 
                          href={selectedCandidate.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedCandidate.linkedin}
                        </a>
                      ) : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">GitHub</label>
                    <p className="text-sm text-gray-900">
                      {selectedCandidate.github ? (
                        <a 
                          href={selectedCandidate.github} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedCandidate.github}
                        </a>
                      ) : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Skills</h3>
                <div className="space-y-3">
                  {getCandidateSkills(selectedCandidate).length > 0 ? (
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {getCandidateSkills(selectedCandidate).map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No skills listed</p>
                  )}
                </div>
              </div>

              {/* Professional Summary */}
              {selectedCandidate.summary && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Professional Summary</h3>
                  <p className="text-sm text-gray-900 leading-relaxed">{selectedCandidate.summary}</p>
                </div>
              )}

              {/* Experience */}
              {selectedCandidate.experiences && selectedCandidate.experiences.length > 0 && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Work Experience</h3>
                  <div className="space-y-4">
                    {selectedCandidate.experiences.map((exp: any, index: number) => (
                      <div key={index} className="border-l-4 border-indigo-400 pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{exp.client || 'Company Name'}</h4>
                          <span className="text-sm text-gray-600">
                            {exp.startMonth} {exp.startYear} - {exp.present ? 'Present' : `${exp.endMonth} ${exp.endYear}`}
                          </span>
                        </div>
                        {exp.responsibilities && (
                          <p className="text-sm text-gray-700 mt-2">{exp.responsibilities}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {selectedCandidate.education && selectedCandidate.education.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Education</h3>
                  <div className="space-y-3">
                    {selectedCandidate.education.map((edu: any, index: number) => (
                      <div key={index} className="border-l-4 border-yellow-400 pl-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{edu.degree || 'Degree'}</h4>
                            <p className="text-sm text-gray-600">{edu.institution || 'Institution'}</p>
                            {edu.educationLevel && (
                              <span className="inline-block mt-1 px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">
                                {edu.educationLevel}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-600">{edu.year || 'Year'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ID Information */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">ID Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Aadhaar Number</label>
                    <p className="text-sm text-gray-900">{selectedCandidate.aadhaar || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">PAN Number</label>
                    <p className="text-sm text-gray-900">{selectedCandidate.pan || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">UAN Number</label>
                    <p className="text-sm text-gray-900">{selectedCandidate.uan || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Application Statistics */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Application Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{selectedCandidate._count?.applications || 0}</p>
                    <p className="text-sm text-gray-600">Applications</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedCandidate._count?.interviews || 0}</p>
                    <p className="text-sm text-gray-600">Interviews</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-6">
            <Button onClick={() => setViewCandidateOpen(false)} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Are you sure you want to delete {candidateToDelete ? getCandidateName(candidateToDelete) : 'this candidate'}?
                </p>
                <p className="mt-2">
                  <strong>This action cannot be undone.</strong> This will permanently delete:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>The candidate's profile and personal information</li>
                  <li>All job applications and interview records</li>
                  <li>Resume file and other uploaded documents</li>
                  <li>User account and login credentials</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteCandidate} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCandidate}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Permanently'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Candidate Modal */}
      <AddResumeModal
        open={editCandidateOpen}
        onOpenChange={(open) => {
          setEditCandidateOpen(open);
          // Refresh data when modal closes after successful edit
          if (!open && candidateToEdit) {
            setCandidateToEdit(null);
            refreshData();
          }
        }}
        editData={candidateToEdit}
        isEditing={true}
      />
    </div>
  );
} 