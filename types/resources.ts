// Resources Library Type Definitions
// PRD #0003: Resources Library (AI Tools, Components, Prompts)

export interface AITool {
  id: string;
  name: string;
  description?: string;
  category?: 'content' | 'technical' | 'local' | 'analytics';
  url?: string;
  pricing?: 'free' | 'freemium' | 'paid';
  use_cases?: string[];
  created_at: string;
}

export interface Component {
  id: string;
  name: string;
  description?: string;
  type?: 'form' | 'card' | 'chart' | 'table' | 'layout';
  code?: string;
  preview_url?: string;
  dependencies?: string[];
  created_at: string;
}

export interface Prompt {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  category?: 'content' | 'technical' | 'local' | 'general';
  tags?: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
