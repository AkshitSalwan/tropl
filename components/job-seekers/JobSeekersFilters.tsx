
import { useState } from "react";
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

  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const handleInputChange = (key: keyof FilterState, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilter = (key: keyof FilterState) => {
    setLocalFilters(prev => ({ ...prev, [key]: '' }));
  };

  const handleSearch = () => {
    // Push all local filter values to parent
    (Object.keys(localFilters) as (keyof FilterState)[]).forEach(key => {
      onFilterChange(key, localFilters[key]);
    });
  };

  const handleClearAll = () => {
    setLocalFilters({ search: '', jobTitle: '', skills: '', location: '' });
    onClearFilters();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        {/* Search Bars Row */}
        <div className="flex flex-1 gap-2">
          {/* Name/Email Search */}
          <div className="relative w-48">
            <Input
              placeholder="Search name/email"
              className="pl-9 pr-8"
              value={localFilters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            {localFilters.search && (
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
          <div className="relative w-40">
            <Input
              placeholder="Job title"
              className="pl-9 pr-8"
              value={localFilters.jobTitle}
              onChange={(e) => handleInputChange('jobTitle', e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            {localFilters.jobTitle && (
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
          <div className="relative w-40">
            <Input
              placeholder="Skills"
              className="pl-9 pr-8"
              value={localFilters.skills}
              onChange={(e) => handleInputChange('skills', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 cursor-pointer"
              onClick={handleSearch}
            />
            {localFilters.skills && (
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
          <div className="relative w-40">
            <Input
              placeholder="Location"
              className="pl-9 pr-8"
              value={localFilters.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            {localFilters.location && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7 text-gray-400 hover:text-gray-600"
                onClick={() => handleClearFilter('location')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {/* Clear All Button */}
        <Button onClick={handleClearAll} className="flex items-center gap-2 h-10 mr-2" variant="outline" type="button">
          <X className="h-4 w-4" />
          Clear All
        </Button>
        {/* Search Button */}
        <Button onClick={handleSearch} className="flex items-center gap-2 h-10" variant="default">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
    </div>
  );
} 