import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, BookOpen, Calendar, Target, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Schedule {
  id: string;
  task: string;
  duration: number;
  completed: boolean;
  subject_id: string | null;
}

interface Subject {
  id: string;
  name: string;
  color: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Fetch today's schedules
      const { data: schedules, error: schedError } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: true });

      if (schedError) throw schedError;

      // Fetch subjects
      const { data: subjectsData, error: subjError } = await supabase
        .from('subjects')
        .select('id, name, color')
        .eq('user_id', user.id);

      if (subjError) throw subjError;

      setTodaySchedules(schedules || []);
      setSubjects(subjectsData || []);

      // Calculate progress
      const completed = schedules?.filter(s => s.completed).length || 0;
      const total = schedules?.length || 0;
      setProgress(total > 0 ? (completed / total) * 100 : 0);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ completed: !completed })
        .eq('id', id);

      if (error) throw error;
      fetchData();
      toast.success(completed ? 'Task unmarked' : 'Task completed!');
    } catch (error: any) {
      toast.error('Failed to update task');
    }
  };

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return null;
    return subjects.find(s => s.id === subjectId)?.name || 'Unknown';
  };

  const getSubjectColor = (subjectId: string | null) => {
    if (!subjectId) return '#6366f1';
    return subjects.find(s => s.id === subjectId)?.color || '#6366f1';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-pulse gradient-text text-2xl font-bold">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Welcome Back!</h1>
          <p className="text-muted-foreground">Here's your study plan for today</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
              <Target className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
              <Progress value={progress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {todaySchedules.filter(s => s.completed).length} of {todaySchedules.length} tasks completed
              </p>
            </CardContent>
          </Card>

          <Card className="glass hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Subjects</CardTitle>
              <BookOpen className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Currently studying {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="glass hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Study Time Today</CardTitle>
              <Calendar className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todaySchedules.reduce((acc, s) => acc + s.duration, 0)} min
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {todaySchedules.length} task{todaySchedules.length !== 1 ? 's' : ''} scheduled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Study Plan
            </CardTitle>
            <CardDescription>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaySchedules.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No tasks scheduled for today</p>
                <Button onClick={() => window.location.href = '/planner'}>
                  Create Schedule
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-card/50 transition-colors"
                  >
                    <button
                      onClick={() => toggleComplete(schedule.id, schedule.completed)}
                      className="flex-shrink-0"
                    >
                      {schedule.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-accent" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h4 className={`font-medium ${schedule.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {schedule.task}
                      </h4>
                      {schedule.subject_id && (
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getSubjectColor(schedule.subject_id) }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {getSubjectName(schedule.subject_id)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {schedule.duration} min
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Dashboard;
