
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type JobCategory = Database['public']['Enums']['job_category'];

const categories: { value: JobCategory; label: string }[] = [
  { value: 'construction', label: 'Construction' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'gardening', label: 'Gardening' },
  { value: 'moving', label: 'Moving' },
  { value: 'handyman', label: 'Handyman' },
  { value: 'tutoring', label: 'Tutoring' },
  { value: 'pet_care', label: 'Pet Care' },
  { value: 'event_help', label: 'Event Help' },
  { value: 'other', label: 'Other' }
];

export default function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | ''>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to post a job',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCategory) {
      toast({
        title: 'Error',
        description: 'Please select a category',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const jobData = {
      poster_id: user.id,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: selectedCategory as JobCategory,
      location: formData.get('location') as string,
      budget: parseFloat(formData.get('budget') as string),
      duration: formData.get('duration') as string,
      requirements: formData.get('requirements') as string,
      contact_info: formData.get('contact_info') as string,
    };

    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Your job has been posted successfully.',
      });

      navigate(`/jobs/${data.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to post job',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to be signed in to post a job.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/auth">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Post a Job</h1>
          <p className="text-lg text-gray-600">
            Find skilled professionals for your project
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-6 w-6" />
              <span>Job Details</span>
            </CardTitle>
            <CardDescription>
              Provide detailed information about your job to attract the right candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    type="text"
                    required
                    placeholder="e.g., House cleaning needed"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={selectedCategory} onValueChange={(value: JobCategory) => setSelectedCategory(value)} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="budget">Budget ($) *</Label>
                  <Input
                    id="budget"
                    name="budget"
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    placeholder="100"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    required
                    placeholder="e.g., New York, NY"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="text"
                    placeholder="e.g., 2 hours, 1 day, flexible"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  placeholder="Describe the job in detail..."
                  className="mt-1 min-h-[120px]"
                />
              </div>

              <div>
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  name="requirements"
                  placeholder="Any specific requirements or qualifications..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contact_info">Contact Information</Label>
                <Textarea
                  id="contact_info"
                  name="contact_info"
                  placeholder="How should applicants contact you? (Phone, email, preferred times, etc.)"
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/browse-jobs')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Posting...' : 'Post Job'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
