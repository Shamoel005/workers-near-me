
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  MapPin, 
  Clock, 
  DollarSign,
  Star,
  Filter,
  Briefcase,
  Hammer,
  Truck,
  Home as HomeIcon,
  GraduationCap,
  Users,
  Heart,
  Wrench,
  Baby,
  Calendar
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type JobCategory = Database['public']['Enums']['job_category'];

interface Job {
  id: string;
  title: string;
  description: string;
  category: JobCategory;
  location: string;
  budget: number;
  duration: string;
  created_at: string;
  profiles: {
    full_name: string;
    rating: number;
  };
}

const categoryIcons = {
  construction: Hammer,
  delivery: Truck,
  cleaning: HomeIcon,
  gardening: Users,
  moving: Truck,
  handyman: Wrench,
  tutoring: GraduationCap,
  pet_care: Heart,
  event_help: Calendar,
  other: Briefcase
};

const categories: JobCategory[] = [
  'construction',
  'delivery',
  'cleaning',
  'gardening',
  'moving',
  'handyman',
  'tutoring',
  'pet_care',
  'event_help',
  'other'
];

// Helper function to check if a string is a valid JobCategory
const isValidJobCategory = (category: string): category is JobCategory => {
  return categories.includes(category as JobCategory);
};

export default function BrowseJobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [searchTerm, selectedCategory, sortBy]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          profiles (
            full_name,
            rating
          )
        `)
        .eq('status', 'active');

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
      }

      if (selectedCategory && isValidJobCategory(selectedCategory)) {
        query = query.eq('category', selectedCategory);
      }

      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'budget_high') {
        query = query.order('budget', { ascending: false });
      } else if (sortBy === 'budget_low') {
        query = query.order('budget', { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams({ search: searchTerm });
  };

  const updateSearchParams = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Jobs</h1>
          <p className="text-lg text-gray-600">
            Find the perfect job opportunity in your area
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <form onSubmit={handleSearch} className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            <Select 
              value={selectedCategory} 
              onValueChange={(value) => {
                setSelectedCategory(value === 'all' ? '' : value);
                updateSearchParams({ category: value === 'all' ? '' : value });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="budget_high">Highest Budget</SelectItem>
                <SelectItem value="budget_low">Lowest Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
              </p>
            </div>
            
            <div className="grid gap-6">
              {jobs.map((job) => {
                const IconComponent = categoryIcons[job.category] || Briefcase;
                return (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                            <Badge variant="secondary">
                              {job.category.charAt(0).toUpperCase() + job.category.slice(1).replace('_', ' ')}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                          <CardDescription className="text-base">
                            {job.description}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            ${job.budget}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(job.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-1" />
                            {job.location}
                          </div>
                          {job.duration && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              {job.duration}
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">
                              {job.profiles?.rating || 'New'} • {job.profiles?.full_name}
                            </span>
                          </div>
                        </div>
                        <Button asChild>
                          <Link to={`/jobs/${job.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
