import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface JobsFiltersProps {
  onSearch: (filters: { query: string }) => void;
}

export function JobsFilters({ onSearch }: JobsFiltersProps) {
  const [jobCode, setJobCode] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");

  // Combine all fields into a single query string for backend
  const buildQuery = () => {
    // Only include non-empty fields, join with space
    return [jobCode, title, location].filter(Boolean).join(" ");
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 flex-1">
      {/* Job Code Search */}
      <div className="relative flex-1">
        <Input
          className="pl-9 pr-2"
          placeholder="Job Code"
          value={jobCode}
          onChange={e => setJobCode(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      {/* Title Search */}
      <div className="relative flex-1">
        <Input
          className="pl-9 pr-2"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      {/* Location Search */}
      <div className="relative flex-1">
        <Input
          className="pl-9 pr-2"
          placeholder="Location"
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      <Button
        className="flex items-center mr-4"
        onClick={() => onSearch({ query: buildQuery() })}
      >
        <Search className="w-4 h-4 mr-2" />
        Search
      </Button>
    </div>
  );
}