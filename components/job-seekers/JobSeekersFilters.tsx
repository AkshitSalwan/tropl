import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Sparkles } from "lucide-react";

interface FilterState {
  search: string;
  jobTitle: string;
  skills: string;
  location: string;
}

interface JobSeekersFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onClearFilters: () => void;
}

export function JobSeekersFilters({ filters, onFilterChange, onClearFilters }: JobSeekersFiltersProps) {
  const handleClearFilter = (key: keyof FilterState) => {
    onFilterChange(key, '');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Name/Email Search */}
        <div className="relative">
          <Input
            placeholder="Search name/email"
            className="pl-9 pr-8"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7 text-gray-400 hover:text-gray-600"
              onClick={() => handleClearFilter('search')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Job Title Search */}
        <div className="relative">
          <Input
            placeholder="Job title"
            className="pl-9 pr-8"
            value={filters.jobTitle}
            onChange={(e) => onFilterChange('jobTitle', e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          {filters.jobTitle && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7 text-gray-400 hover:text-gray-600"
              onClick={() => handleClearFilter('jobTitle')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Skills Search */}
        <div className="relative">
          <Input
            placeholder="Skills"
            className="pl-9 pr-8"
            value={filters.skills}
            onChange={(e) => onFilterChange('skills', e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          {filters.skills && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7 text-gray-400 hover:text-gray-600"
              onClick={() => handleClearFilter('skills')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Location Search */}
        <div className="relative">
          <Input
            placeholder="Location"
            className="pl-9 pr-16"
            value={filters.location}
            onChange={(e) => onFilterChange('location', e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          {filters.location && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-8 top-1 h-7 w-7 text-gray-400 hover:text-gray-600"
              onClick={() => handleClearFilter('location')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {(filters.search || filters.jobTitle || filters.skills || filters.location) && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7 text-red-400 hover:text-red-600"
              onClick={onClearFilters}
              title="Clear all filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 