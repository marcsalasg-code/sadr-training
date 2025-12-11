/**
 * SessionFilters - Search and filter controls for sessions
 */

import { Input, Select } from '../ui';

interface Athlete {
    id: string;
    name: string;
}

interface SessionFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filterStatus: string;
    onStatusChange: (status: string) => void;
    filterAthlete: string;
    onAthleteChange: (athleteId: string) => void;
    athletes: Athlete[];
}

export function SessionFilters({
    searchQuery,
    onSearchChange,
    filterStatus,
    onStatusChange,
    filterAthlete,
    onAthleteChange,
    athletes,
}: SessionFiltersProps) {
    return (
        <div className="flex flex-wrap gap-4 p-4 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg">
            <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="max-w-xs"
            />
            <Select
                value={filterStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'planned', label: 'Planned' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'cancelled', label: 'Cancelled' },
                ]}
                className="w-40"
            />
            <Select
                value={filterAthlete}
                onChange={(e) => onAthleteChange(e.target.value)}
                options={[
                    { value: 'all', label: 'All Athletes' },
                    ...athletes.map(a => ({ value: a.id, label: a.name })),
                ]}
                className="w-40"
            />
        </div>
    );
}
