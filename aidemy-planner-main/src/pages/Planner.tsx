import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

interface Subject {
  id: string;
  name: string;
  priority: number;
  color: string;
}

interface GeneratedSchedule {
  date: string;
  task: string;
  duration: number;
  subject_id: string;
}

const Planner = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoursPerDay, setHoursPerDay] = useState('2');
  const [days, setDays] = useState('7');
  const [generatedSchedules, setGeneratedSchedules] = useState<GeneratedSchedule[]>([]);

  useEffect(() => {
    fetchSubjects();
  }, [user]);

  const fetchSubjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, priority, color')
        .eq('user_id', user.id);

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      toast.error('Failed to load subjects');
    }
  };

  const generateSchedule = async () => {
    if (!user) {
      toast.error('Please sign in to generate a schedule');
      return;
    }
    
    if (subjects.length === 0) {
      toast.error('Please create some subjects first in the Subjects page');
      return;
    }

    const hours = parseFloat(hoursPerDay);
    const numDays = parseInt(days);
    
    if (isNaN(hours) || hours <= 0 || hours > 12) {
      toast.error('Please enter valid hours per day (0.5 - 12)');
      return;
    }
    
    if (isNaN(numDays) || numDays < 1 || numDays > 30) {
      toast.error('Please enter valid number of days (1 - 30)');
      return;
    }

    setLoading(true);
    try {
      console.log('Generating schedule with:', { hours, numDays, userId: user.id });
      
      const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: {
          availableHoursPerDay: hours,
          days: numDays,
          userId: user.id,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Schedule generated:', data);
      setGeneratedSchedules(data.schedules || []);
      toast.success('Schedule generated successfully!');
    } catch (error: any) {
      console.error('Failed to generate schedule:', error);
      toast.error(error.message || 'Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  const saveSchedule = async () => {
    if (!user || generatedSchedules.length === 0) return;

    setLoading(true);
    try {
      const schedulesToInsert = generatedSchedules.map(schedule => ({
        user_id: user.id,
        subject_id: schedule.subject_id,
        date: schedule.date,
        task: schedule.task,
        duration: schedule.duration,
        completed: false,
      }));

      const { error } = await supabase
        .from('schedules')
        .insert(schedulesToInsert);

      if (error) throw error;

      toast.success('Schedule saved successfully!');
      setGeneratedSchedules([]);
    } catch (error: any) {
      toast.error('Failed to save schedule');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getSubjectColor = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.color || '#6366f1';
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || 'Unknown';
  };

  // Group schedules by date
  const schedulesByDate = generatedSchedules.reduce((acc, schedule) => {
    if (!acc[schedule.date]) {
      acc[schedule.date] = [];
    }
    acc[schedule.date].push(schedule);
    return acc;
  }, {} as { [key: string]: GeneratedSchedule[] });

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Smart Planner</h1>
          <p className="text-muted-foreground">Generate an intelligent study schedule based on your subjects</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Schedule Generator
              </CardTitle>
              <CardDescription>
                AI-powered schedule generation based on priority
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hours">Available Hours Per Day</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="days">Number of Days</Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              </div>
              <Button
                onClick={generateSchedule}
                disabled={loading || subjects.length === 0}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Schedule
                  </>
                )}
              </Button>

              {subjects.length === 0 && (
                <div className="text-sm text-muted-foreground text-center p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">No subjects found</p>
                  <p>Please create subjects first in the Subjects page</p>
                </div>
              )}

              {generatedSchedules.length > 0 && (
                <Button
                  onClick={saveSchedule}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  Save to Calendar
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            {generatedSchedules.length === 0 ? (
              <Card className="glass">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Calendar className="w-16 h-16 mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No schedule generated yet</h3>
                  <p className="text-muted-foreground text-center">
                    Configure your preferences and click "Generate Schedule" to create an optimized study plan
                  </p>
                </CardContent>
              </Card>
            ) : (
              Object.keys(schedulesByDate)
                .sort()
                .map((date) => (
                  <Card key={date} className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {schedulesByDate[date].map((schedule, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-card/50 transition-colors"
                          >
                            <div
                              className="w-1 h-12 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getSubjectColor(schedule.subject_id) }}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{schedule.task}</h4>
                              <p className="text-sm text-muted-foreground">
                                {getSubjectName(schedule.subject_id)}
                              </p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {schedule.duration} min
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Planner;
