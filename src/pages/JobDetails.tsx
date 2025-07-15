
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Clock, 
  DollarSign,
  Star,
  User,
  Calendar,
  Send,
  ArrowLeft,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: number;
  duration: string;
  requirements: string;
  contact_info: string;
  status: string;
  created_at: string;
  poster_id: string;
  profiles: {
    full_name: string;
    rating: number;
    total_reviews: number;
  };
}

interface Application {
  id: string;
  message: string;
  proposed_rate: number;
  status: string;
  applied_at: string;
  profiles: {
    full_name: string;
    rating: number;
  };
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [userApplication, setUserApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [proposedRate, setProposedRate] = useState('');

  useEffect(() => {
    if (id) {
      fetchJobDetails();
      if (user) {
        fetchUserApplication();
        fetchApplications();
      }
    }
  }, [id, user]);

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles (
            full_name,
            rating,
            total_reviews
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserApplication = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          profiles (
            full_name,
            rating
          )
        `)
        .eq('job_id', id)
        .eq('applicant_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setUserApplication(data);
    } catch (error) {
      console.error('Error fetching user application:', error);
    }
  };

  const fetchApplications = async () => {
    if (!user || !job || job.poster_id !== user.id) return;

    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          profiles (
            full_name,
            rating
          )
        `)
        .eq('job_id', id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !job) return;

    setApplying(true);
    try {
      const { error } = await supabase
        .from('applications')
        .insert([{
          job_id: job.id,
          applicant_id: user.id,
          message,
          proposed_rate: proposedRate ? parseFloat(proposedRate) : null,
        }]);

      if (error) throw error;

      toast({
        title: 'Application sent!',
        description: 'Your application has been submitted successfully.',
      });

      fetchUserApplication();
      setMessage('');
      setProposedRate('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  };

  const handleApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: 'Application updated',
        description: `Application has been ${status}.`,
      });

      fetchApplications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update application',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Job Not Found</CardTitle>
            <CardDescription>
              The job you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/browse-jobs">Browse Other Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isJobPoster = user?.id === job.poster_id;
  const canApply = user && !isJobPoster && !userApplication && job.status === 'active';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="outline" asChild className="mb-6">
          <Link to="/browse-jobs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {job.category.charAt(0).toUpperCase() + job.category.slice(1).replace('_', ' ')}
                    </Badge>
                    <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(job.created_at).toLocaleDateString()}
                      </div>
                      {job.duration && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {job.duration}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      ${job.budget}
                    </div>
                    <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                </div>

                {job.requirements && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                  </div>
                )}

                {job.contact_info && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{job.contact_info}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Form */}
            {canApply && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Apply for this Job</CardTitle>
                  <CardDescription>
                    Submit your application with a message and proposed rate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleApply} className="space-y-4">
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell the employer why you're the right person for this job..."
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="proposed_rate">Proposed Rate ($) - Optional</Label>
                      <Input
                        id="proposed_rate"
                        type="number"
                        min="1"
                        step="0.01"
                        value={proposedRate}
                        onChange={(e) => setProposedRate(e.target.value)}
                        placeholder="Your proposed rate for this job"
                        className="mt-1"
                      />
                    </div>
                    <Button type="submit" disabled={applying}>
                      <Send className="h-4 w-4 mr-2" />
                      {applying ? 'Sending...' : 'Send Application'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* User's Application Status */}
            {userApplication && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Your Application</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Status:</span>
                      <Badge variant={
                        userApplication.status === 'accepted' ? 'default' :
                        userApplication.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {userApplication.status.charAt(0).toUpperCase() + userApplication.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Message:</span>
                      <p className="text-gray-700 mt-1">{userApplication.message}</p>
                    </div>
                    {userApplication.proposed_rate && (
                      <div>
                        <span className="font-medium">Proposed Rate:</span>
                        <span className="ml-2 text-green-600 font-semibold">
                          ${userApplication.proposed_rate}
                        </span>
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      Applied on {new Date(userApplication.applied_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Applications Management (for job poster) */}
            {isJobPoster && applications.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Applications ({applications.length})</CardTitle>
                  <CardDescription>
                    Manage applications for your job posting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div key={application.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{application.profiles.full_name}</h4>
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span>{application.profiles.rating || 'New'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              application.status === 'accepted' ? 'default' :
                              application.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </Badge>
                            {application.proposed_rate && (
                              <div className="text-green-600 font-semibold mt-1">
                                ${application.proposed_rate}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{application.message}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Applied on {new Date(application.applied_at).toLocaleDateString()}
                          </div>
                          {application.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleApplicationStatus(application.id, 'accepted')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApplicationStatus(application.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Job Poster</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold">{job.profiles.full_name}</h4>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-medium">{job.profiles.rating || 'New'}</span>
                    <span className="text-gray-600">
                      ({job.profiles.total_reviews || 0} reviews)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!user && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Interested in this job?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Sign in to apply for this job and connect with the employer.
                  </p>
                  <Button asChild className="w-full">
                    <Link to="/auth">Sign In to Apply</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
