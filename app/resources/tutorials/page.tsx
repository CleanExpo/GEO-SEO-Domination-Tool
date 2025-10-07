'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Play, Clock, Award, Search, X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  video_url?: string;
  resources?: string[];
  favorite: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

interface TutorialProgress {
  [tutorialId: string]: {
    completionRate: number;
    lastAccessed: string;
    currentLesson?: number;
  };
}

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [progress, setProgress] = useState<TutorialProgress>({});
  const [currentTutorialIndex, setCurrentTutorialIndex] = useState(0);

  useEffect(() => {
    fetchTutorials();
    loadProgress();
  }, []);

  const loadProgress = () => {
    try {
      const savedProgress = localStorage.getItem('tutorial-progress');
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = (tutorialId: string, completionRate: number) => {
    const newProgress = {
      ...progress,
      [tutorialId]: {
        completionRate,
        lastAccessed: new Date().toISOString(),
      },
    };
    setProgress(newProgress);
    localStorage.setItem('tutorial-progress', JSON.stringify(newProgress));
  };

  const fetchTutorials = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/resources/tutorials');

      if (!response.ok) {
        throw new Error('Failed to fetch tutorials');
      }

      const data = await response.json();
      setTutorials(data.tutorials || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching tutorials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTutorial = () => {
    console.log('Add tutorial clicked');
  };

  const openTutorial = async (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    const tutorialIndex = filteredTutorials.findIndex(t => t.id === tutorial.id);
    setCurrentTutorialIndex(tutorialIndex);

    // Increment view count
    try {
      await fetch(`/api/resources/tutorials/${tutorial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ views: tutorial.views + 1 }),
      });
    } catch (error) {
      console.error('Error updating view count:', error);
    }
  };

  const closeTutorial = () => {
    setSelectedTutorial(null);
  };

  const markAsComplete = () => {
    if (selectedTutorial) {
      saveProgress(selectedTutorial.id, 100);
    }
  };

  const navigateTutorial = (direction: 'prev' | 'next') => {
    if (!selectedTutorial) return;

    const newIndex = direction === 'next'
      ? Math.min(currentTutorialIndex + 1, filteredTutorials.length - 1)
      : Math.max(currentTutorialIndex - 1, 0);

    if (newIndex !== currentTutorialIndex) {
      setCurrentTutorialIndex(newIndex);
      setSelectedTutorial(filteredTutorials[newIndex]);
    }
  };

  const getTutorialProgress = (tutorialId: string) => {
    return progress[tutorialId]?.completionRate || 0;
  };

  const getDifficultyColor = (difficulty: Tutorial['difficulty']) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
    };
    return colors[difficulty];
  };

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !selectedDifficulty || tutorial.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const categories = Array.from(new Set(tutorials.map(t => t.category)));

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Error loading tutorials</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchTutorials}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tutorials</h1>
            <p className="text-gray-600 mt-1">Learn SEO strategies and best practices</p>
          </div>
          <button
            onClick={handleAddTutorial}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Tutorial
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Tutorials</p>
              <p className="text-2xl font-bold text-gray-900">{tutorials.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Play className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {tutorials.filter(t => {
                  const prog = getTutorialProgress(t.id);
                  return prog > 0 && prog < 100;
                }).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {tutorials.filter(t => getTutorialProgress(t.id) === 100).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {tutorials.length > 0 && (
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tutorials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDifficulty(null)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                !selectedDifficulty
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Levels
            </button>
            <button
              onClick={() => setSelectedDifficulty('beginner')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedDifficulty === 'beginner'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Beginner
            </button>
            <button
              onClick={() => setSelectedDifficulty('intermediate')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedDifficulty === 'intermediate'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Intermediate
            </button>
            <button
              onClick={() => setSelectedDifficulty('advanced')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedDifficulty === 'advanced'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Advanced
            </button>
          </div>
        </div>
      )}

      {/* Tutorials Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600">Loading tutorials...</p>
        </div>
      ) : filteredTutorials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTutorials.map((tutorial) => (
            <div
              key={tutorial.id}
              className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{tutorial.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{tutorial.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{tutorial.duration} min</span>
                </div>
                {tutorial.category && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {tutorial.category}
                  </span>
                )}
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(tutorial.difficulty)}`}>
                  {tutorial.difficulty}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold text-gray-900">{getTutorialProgress(tutorial.id)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all"
                    style={{ width: `${getTutorialProgress(tutorial.id)}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => openTutorial(tutorial)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Play className="h-4 w-4" />
                {getTutorialProgress(tutorial.id) === 0 ? 'Start Tutorial' :
                 getTutorialProgress(tutorial.id) === 100 ? 'Review' : 'Continue'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-12 max-w-md w-full text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tutorials available</h3>
            <p className="text-gray-600 mb-6">
              Start your learning journey by adding your first SEO tutorial.
            </p>
            <button
              onClick={handleAddTutorial}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto"
            >
              <Plus className="h-5 w-5" />
              Add Your First Tutorial
            </button>
          </div>
        </div>
      )}

      {/* Tutorial Viewer Modal */}
      {selectedTutorial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{selectedTutorial.title}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(selectedTutorial.difficulty)}`}>
                    {selectedTutorial.difficulty}
                  </span>
                  {selectedTutorial.category && (
                    <span className="text-sm text-gray-600">{selectedTutorial.category}</span>
                  )}
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{selectedTutorial.duration} min</span>
                  </div>
                </div>
              </div>
              <button
                onClick={closeTutorial}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedTutorial.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Overview</h3>
                  <p className="text-gray-700">{selectedTutorial.description}</p>
                </div>
              )}

              {selectedTutorial.video_url && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Video Tutorial</h3>
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <iframe
                      src={selectedTutorial.video_url}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tutorial Content</h3>
                <div className="prose prose-sm max-w-none">
                  <div
                    className="text-gray-700 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: selectedTutorial.content }}
                  />
                </div>
              </div>

              {selectedTutorial.resources && selectedTutorial.resources.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Resources</h3>
                  <ul className="space-y-2">
                    {selectedTutorial.resources.map((resource, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <BookOpen className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{resource}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedTutorial.tags && selectedTutorial.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTutorial.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-900">
                      {getTutorialProgress(selectedTutorial.id)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all"
                      style={{ width: `${getTutorialProgress(selectedTutorial.id)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => navigateTutorial('prev')}
                  disabled={currentTutorialIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Previous
                </button>

                <button
                  onClick={markAsComplete}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle className="h-5 w-5" />
                  {getTutorialProgress(selectedTutorial.id) === 100 ? 'Completed' : 'Mark as Complete'}
                </button>

                <button
                  onClick={() => navigateTutorial('next')}
                  disabled={currentTutorialIndex === filteredTutorials.length - 1}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
