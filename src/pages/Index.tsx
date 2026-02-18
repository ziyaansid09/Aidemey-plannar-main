import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain, Calendar, BookOpen, Sparkles, ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
        <div className="flex items-center justify-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center animate-pulse-glow">
            <Brain className="w-14 h-14 text-white" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold gradient-text mb-4">AI Study Planner</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your intelligent study companion powered by AI. Create personalized schedules, manage subjects, and get smart study recommendations.
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="glass p-6 rounded-xl hover-lift">
            <Calendar className="w-12 h-12 mb-4 mx-auto text-primary" />
            <h3 className="font-bold mb-2">Smart Scheduling</h3>
            <p className="text-sm text-muted-foreground">AI-powered schedule generation based on your priorities</p>
          </div>
          <div className="glass p-6 rounded-xl hover-lift">
            <BookOpen className="w-12 h-12 mb-4 mx-auto text-secondary" />
            <h3 className="font-bold mb-2">Subject Management</h3>
            <p className="text-sm text-muted-foreground">Organize subjects and chapters efficiently</p>
          </div>
          <div className="glass p-6 rounded-xl hover-lift">
            <Sparkles className="w-12 h-12 mb-4 mx-auto text-accent" />
            <h3 className="font-bold mb-2">AI Suggestions</h3>
            <p className="text-sm text-muted-foreground">Get personalized study recommendations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
