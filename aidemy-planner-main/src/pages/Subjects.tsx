import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Plus, Trash2, Edit, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface Subject {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  color: string;
}

interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  description: string | null;
  completed: boolean;
}

const COLORS = [
  '#6366f1', // Primary
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

const Subjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<{ [key: string]: Chapter[] }>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: '2',
    color: COLORS[0],
  });

  const [chapterFormData, setChapterFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchSubjects();
  }, [user]);

  const fetchSubjects = async () => {
    if (!user) return;

    try {
      const { data: subjectsData, error: subjError } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (subjError) throw subjError;

      setSubjects(subjectsData || []);

      // Fetch chapters for all subjects
      const { data: chaptersData, error: chapError } = await supabase
        .from('chapters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (chapError) throw chapError;

      // Group chapters by subject_id
      const groupedChapters: { [key: string]: Chapter[] } = {};
      chaptersData?.forEach((chapter) => {
        if (!groupedChapters[chapter.subject_id]) {
          groupedChapters[chapter.subject_id] = [];
        }
        groupedChapters[chapter.subject_id].push(chapter);
      });

      setChapters(groupedChapters);
    } catch (error: any) {
      toast.error('Failed to load subjects');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingSubject) {
        const { error } = await supabase
          .from('subjects')
          .update({
            name: formData.name,
            description: formData.description,
            priority: parseInt(formData.priority),
            color: formData.color,
          })
          .eq('id', editingSubject.id);

        if (error) throw error;
        toast.success('Subject updated successfully');
      } else {
        const { error } = await supabase
          .from('subjects')
          .insert({
            user_id: user.id,
            name: formData.name,
            description: formData.description,
            priority: parseInt(formData.priority),
            color: formData.color,
          });

        if (error) throw error;
        toast.success('Subject created successfully');
      }

      fetchSubjects();
      setDialogOpen(false);
      setEditingSubject(null);
      setFormData({ name: '', description: '', priority: '2', color: COLORS[0] });
    } catch (error: any) {
      toast.error('Failed to save subject');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject? This will also delete all associated chapters.')) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Subject deleted');
      fetchSubjects();
    } catch (error: any) {
      toast.error('Failed to delete subject');
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSubject) return;

    try {
      const { error } = await supabase
        .from('chapters')
        .insert({
          user_id: user.id,
          subject_id: selectedSubject,
          name: chapterFormData.name,
          description: chapterFormData.description,
        });

      if (error) throw error;
      toast.success('Chapter added');
      fetchSubjects();
      setChapterDialogOpen(false);
      setChapterFormData({ name: '', description: '' });
    } catch (error: any) {
      toast.error('Failed to add chapter');
    }
  };

  const toggleChapterComplete = async (chapterId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ completed: !completed })
        .eq('id', chapterId);

      if (error) throw error;
      fetchSubjects();
    } catch (error: any) {
      toast.error('Failed to update chapter');
    }
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Subjects</h1>
            <p className="text-muted-foreground">Manage your subjects and chapters</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
                <DialogDescription>
                  Create a new subject to organize your study material
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Mathematics"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">High (1)</SelectItem>
                      <SelectItem value="2">Medium (2)</SelectItem>
                      <SelectItem value="3">Low (3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? 'scale-125 ring-2 ring-primary' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {editingSubject ? 'Update Subject' : 'Create Subject'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {subjects.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-16 h-16 mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No subjects yet</h3>
              <p className="text-muted-foreground mb-4">Create your first subject to get started</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjects.map((subject) => (
              <Card key={subject.id} className="glass hover-lift">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: subject.color }}
                      />
                      <div>
                        <CardTitle>{subject.name}</CardTitle>
                        <CardDescription>{subject.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSubject(subject);
                          setFormData({
                            name: subject.name,
                            description: subject.description || '',
                            priority: subject.priority.toString(),
                            color: subject.color,
                          });
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(subject.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {chapters[subject.id]?.map((chapter) => (
                      <div
                        key={chapter.id}
                        className="flex items-center gap-2 p-2 rounded border border-border hover:bg-card/50"
                      >
                        <input
                          type="checkbox"
                          checked={chapter.completed}
                          onChange={() => toggleChapterComplete(chapter.id, chapter.completed)}
                          className="w-4 h-4"
                        />
                        <span className={chapter.completed ? 'line-through text-muted-foreground' : ''}>
                          {chapter.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedSubject(subject.id);
                      setChapterDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Chapter
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Chapter</DialogTitle>
              <DialogDescription>
                Add a new chapter to this subject
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddChapter} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chapter-name">Chapter Name</Label>
                <Input
                  id="chapter-name"
                  value={chapterFormData.name}
                  onChange={(e) => setChapterFormData({ ...chapterFormData, name: e.target.value })}
                  placeholder="e.g., Introduction to Algebra"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chapter-description">Description</Label>
                <Textarea
                  id="chapter-description"
                  value={chapterFormData.description}
                  onChange={(e) => setChapterFormData({ ...chapterFormData, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
              <Button type="submit" className="w-full">
                Add Chapter
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Subjects;
