import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Plus, Trash2, Edit, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Note {
  id: string;
  title: string;
  content: string | null;
  resources: string[] | null;
  subject_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Subject {
  id: string;
  name: string;
  color: string;
}

const Notes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject_id: '',
    resources: '',
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [notesResponse, subjectsResponse] = await Promise.all([
        supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('subjects')
          .select('id, name, color')
          .eq('user_id', user.id),
      ]);

      if (notesResponse.error) throw notesResponse.error;
      if (subjectsResponse.error) throw subjectsResponse.error;

      setNotes(notesResponse.data || []);
      setSubjects(subjectsResponse.data || []);
    } catch (error: any) {
      toast.error('Failed to load notes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const resourcesArray = formData.resources
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0);

      if (editingNote) {
        const { error } = await supabase
          .from('notes')
          .update({
            title: formData.title,
            content: formData.content,
            subject_id: formData.subject_id || null,
            resources: resourcesArray.length > 0 ? resourcesArray : null,
          })
          .eq('id', editingNote.id);

        if (error) throw error;
        toast.success('Note updated');
      } else {
        const { error } = await supabase
          .from('notes')
          .insert({
            user_id: user.id,
            title: formData.title,
            content: formData.content,
            subject_id: formData.subject_id || null,
            resources: resourcesArray.length > 0 ? resourcesArray : null,
          });

        if (error) throw error;
        toast.success('Note created');
      }

      fetchData();
      setDialogOpen(false);
      setEditingNote(null);
      setFormData({ title: '', content: '', subject_id: '', resources: '' });
    } catch (error: any) {
      toast.error('Failed to save note');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Note deleted');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete note');
    }
  };

  const getSubjectColor = (subjectId: string | null) => {
    if (!subjectId) return null;
    return subjects.find(s => s.id === subjectId)?.color || '#6366f1';
  };

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return null;
    return subjects.find(s => s.id === subjectId)?.name || 'Unknown';
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
            <h1 className="text-4xl font-bold gradient-text mb-2">Notes</h1>
            <p className="text-muted-foreground">Organize your study notes and resources</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingNote ? 'Edit Note' : 'Create New Note'}</DialogTitle>
                <DialogDescription>
                  Add notes and resources for your studies
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Note title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject (Optional)</Label>
                  <Select value={formData.subject_id} onValueChange={(value) => setFormData({ ...formData, subject_id: value === 'none' ? '' : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your notes here..."
                    rows={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resources">Resources (one per line)</Label>
                  <Textarea
                    id="resources"
                    value={formData.resources}
                    onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
                    placeholder="https://example.com/resource1&#10;Chapter 5 textbook&#10;Professor's lecture notes"
                    rows={4}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingNote ? 'Update Note' : 'Create Note'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {notes.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No notes yet</h3>
              <p className="text-muted-foreground mb-4">Create your first note to get started</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <Card key={note.id} className="glass hover-lift">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-1">{note.title}</CardTitle>
                      {note.subject_id && (
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getSubjectColor(note.subject_id) }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {getSubjectName(note.subject_id)}
                          </span>
                        </div>
                      )}
                      <CardDescription>
                        {format(new Date(note.updated_at), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingNote(note);
                          setFormData({
                            title: note.title,
                            content: note.content || '',
                            subject_id: note.subject_id || '',
                            resources: note.resources?.join('\n') || '',
                          });
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {note.content && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {note.content}
                    </p>
                  )}
                  {note.resources && note.resources.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <LinkIcon className="w-3 h-3" />
                        <span>{note.resources.length} resource{note.resources.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Notes;
