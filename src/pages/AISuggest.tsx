import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, BookOpen, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface Subject {
  id: string;
  name: string;
}

interface Suggestion {
  title: string;
  studyPlan: string;
  resources: string[];
}

const AISuggest = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, [user]);

  const fetchSubjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('user_id', user.id);

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      toast.error('Failed to load subjects');
    }
  };

  const getSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setLoading(true);
    try {
      const subjectName = subjects.find(s => s.id === selectedSubject)?.name || 'General';
      
      const { data, error } = await supabase.functions.invoke('ai-suggest', {
        body: {
          subject: subjectName,
          topic: topic,
        },
      });

      if (error) throw error;

      setSuggestion(data.suggestion);
    } catch (error: any) {
      toast.error('Failed to get AI suggestion');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">AI Study Suggestions</h1>
          <p className="text-muted-foreground">Get intelligent study recommendations powered by AI</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Get Suggestion
              </CardTitle>
              <CardDescription>
                AI will generate personalized study recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={getSuggestion} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject (Optional)</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Calculus derivatives"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get AI Suggestion
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            {!suggestion ? (
              <Card className="glass">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Lightbulb className="w-16 h-16 mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No suggestions yet</h3>
                  <p className="text-muted-foreground text-center">
                    Enter a topic and get AI-powered study recommendations
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      {suggestion.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-invert max-w-none">
                      <p className="whitespace-pre-wrap">{suggestion.studyPlan}</p>
                    </div>
                  </CardContent>
                </Card>

                {suggestion.resources && suggestion.resources.length > 0 && (
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Recommended Resources
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {suggestion.resources.map((resource, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{resource}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AISuggest;
