import { ArrowRight, Calendar, Globe, Building2, Eye, Trash2, Edit, Grid3x3, List, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState, useMemo, useEffect } from 'react';
import { ref } from 'process';

export interface SavedMapping {
  id: string;
  timestamp: number;
  sourceCountry: string;
  sourceDomain: string;
  sourceSystem: string;
  targetCountry: string;
  targetDomain: string;
  targetSystem: string;
  mappingCount: number;
  approvedMappings: Array<{ targetKey: string; sourceKey: string }>;
}

interface PastMappingsViewProps {
  mappings: SavedMapping[];
  onViewMapping: (mapping: SavedMapping) => void;
  onDeleteMapping: (id: string) => void;
  onEditMapping?: (mapping: SavedMapping) => void;
  refresh: () => void;
}

type ViewMode = 'grid' | 'table';
type FilterType = 'all' | 'origin' | 'destination';

export const PastMappings = ({ mappings, onViewMapping, onDeleteMapping, onEditMapping,refresh }: PastMappingsViewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [systemFilter, setSystemFilter] = useState<string>('all');
  // console.log('PastMappings rendered with mappings:', mappings);
  useEffect(() => {
    refresh();
  });
  // Extract unique values for filters
  const { countries, domains, systems } = useMemo(() => {
    const countries = new Set<string>();
    const domains = new Set<string>();
    const systems = new Set<string>();

    mappings.forEach(m => {
      if (filterType === 'all' || filterType === 'origin') {
        countries.add(m.sourceCountry);
        domains.add(m.sourceDomain);
        systems.add(m.sourceSystem);
      }
      if (filterType === 'all' || filterType === 'destination') {
        countries.add(m.targetCountry);
        domains.add(m.targetDomain);
        systems.add(m.targetSystem);
      }
    });

    return {
      countries: Array.from(countries).sort(),
      domains: Array.from(domains).sort(),
      systems: Array.from(systems).sort()
    };
  }, [mappings, filterType]);

  // Filter mappings
  const filteredMappings = useMemo(() => {
    return mappings.filter(mapping => {
      const checkOrigin = filterType === 'all' || filterType === 'origin';
      const checkDestination = filterType === 'all' || filterType === 'destination';

      const countryMatch = countryFilter === 'all' || 
        (checkOrigin && mapping.sourceCountry === countryFilter) ||
        (checkDestination && mapping.targetCountry === countryFilter);

      const domainMatch = domainFilter === 'all' || 
        (checkOrigin && mapping.sourceDomain === domainFilter) ||
        (checkDestination && mapping.targetDomain === domainFilter);

      const systemMatch = systemFilter === 'all' || 
        (checkOrigin && mapping.sourceSystem === systemFilter) ||
        (checkDestination && mapping.targetSystem === systemFilter);

      return countryMatch && domainMatch && systemMatch;
    });
  }, [mappings, filterType, countryFilter, domainFilter, systemFilter]);

  if (mappings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Building2 className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Past Mappings</h3>
        <p className="text-muted-foreground">
          Your approved mappings will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and View Toggle */}
      <div className="space-y-4">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Filters</h3>
          </div>
          <div className="flex gap-2">
            {/* <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="w-4 h-4 mr-2" />
              Table
            </Button> */}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid md:grid-cols-4 gap-4">
          {/* Filter Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Filter By</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as FilterType);
                setCountryFilter('all');
                setDomainFilter('all');
                setSystemFilter('all');
              }}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All</option>
              <option value="origin">Origin</option>
              <option value="destination">Destination</option>
            </select>
          </div>

          {/* Country Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Country</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {/* Domain Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Domain</label>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Domains</option>
              {domains.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>

          {/* System Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">System</label>
            <select
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Systems</option>
              {systems.map(system => (
                <option key={system} value={system}>{system}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredMappings.length} of {mappings.length} mappings
        </div>
      </div>

      {/* Content */}
      {filteredMappings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No mappings match the selected filters</p>
        </div>
      ) : viewMode === 'grid' ? (
        <GridView 
          mappings={filteredMappings} 
          onViewMapping={onViewMapping} 
          onDeleteMapping={onDeleteMapping}
          onEditMapping={onEditMapping}
        />
      ) : (
        <TableView 
          mappings={filteredMappings} 
          onViewMapping={onViewMapping} 
          onDeleteMapping={onDeleteMapping}
          onEditMapping={onEditMapping}
        />
      )}
    </div>
  );
};

// Grid View Component
const GridView = ({ mappings, onViewMapping, onDeleteMapping, onEditMapping }: { 
  mappings: SavedMapping[]; 
  onViewMapping: (mapping: SavedMapping) => void; 
  onDeleteMapping: (id: string) => void;
  onEditMapping?: (mapping: SavedMapping) => void;
}) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {mappings.map((mapping) => (
      <Card
        key={mapping.id}
        className="p-6 hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 group"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {new Date(mapping.timestamp).toLocaleDateString()}
          </div>
          <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
            {mapping.mappingCount} mappings
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-primary">Origin</span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{mapping.sourceCountry}</p>
              <p className="text-muted-foreground">{mapping.sourceDomain}</p>
              <p className="text-muted-foreground text-xs">{mapping.sourceSystem}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-6 h-6 text-primary animate-pulse" />
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-accent" />
              <span className="font-semibold text-sm text-accent">Destination</span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{mapping.targetCountry}</p>
              <p className="text-muted-foreground">{mapping.targetDomain}</p>
              <p className="text-muted-foreground text-xs">{mapping.targetSystem}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={() => onViewMapping(mapping)}
            size="sm"
            className="group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent transition-all"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {onEditMapping && (
            <Button
              onClick={() => onEditMapping(mapping)}
              size="sm"
              variant="outline"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteMapping(mapping.id);
            }}
            size="sm"
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    ))}
  </div>
);

// Helper function to generate mapping identifier
const generateMappingId = (mapping: SavedMapping): string => {
  const getShortForm = (text: string): string => {
    // Split by spaces and take first letter of each word, max 3 letters
    const words = text.trim().split(/\s+/);
    if (words.length === 1) {
      return text.substring(0, 3).toUpperCase();
    }
    return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
  };

  const originCountry = getShortForm(mapping.sourceCountry);
  const originDomain = getShortForm(mapping.sourceDomain);
  const originSystem = getShortForm(mapping.sourceSystem);
  const destCountry = getShortForm(mapping.targetCountry);
  const destDomain = getShortForm(mapping.targetDomain);
  const destSystem = getShortForm(mapping.targetSystem);

  return `${originCountry}_${originDomain}_${originSystem}_${destCountry}_${destDomain}_${destSystem}`;
};

// Table View Component
const TableView = ({ mappings, onViewMapping, onDeleteMapping, onEditMapping }: { 
  mappings: SavedMapping[]; 
  onViewMapping: (mapping: SavedMapping) => void; 
  onDeleteMapping: (id: string) => void;
  onEditMapping?: (mapping: SavedMapping) => void;
}) => (
  <div className="border rounded-lg overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">Mapping ID</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Origin Country</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Origin Domain</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Origin System</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Destination Country</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Destination Domain</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Destination System</th>
            <th className="px-4 py-3 text-center text-sm font-semibold">Mappings</th>
            <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {mappings.map((mapping) => (
            <tr key={mapping.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-4 py-3 text-sm font-mono font-semibold text-primary whitespace-nowrap">
                {generateMappingId(mapping)}
              </td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">
                {new Date(mapping.timestamp).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-sm">{mapping.sourceCountry}</td>
              <td className="px-4 py-3 text-sm">{mapping.sourceDomain}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{mapping.sourceSystem}</td>
              <td className="px-4 py-3 text-sm">{mapping.targetCountry}</td>
              <td className="px-4 py-3 text-sm">{mapping.targetDomain}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{mapping.targetSystem}</td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {mapping.mappingCount}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    onClick={() => onViewMapping(mapping)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {onEditMapping && (
                    <Button
                      onClick={() => onEditMapping(mapping)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    onClick={() => onDeleteMapping(mapping.id)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
