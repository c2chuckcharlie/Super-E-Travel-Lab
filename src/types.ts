export type StepId = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Language = 'en' | 'zh';

export interface UserStory {
  role: string;
  action: string;
  value: string;
}

export interface HiddenNeed {
  category: string;
  description: string;
}

export interface JourneyPoint {
  phase: 'Before' | 'During' | 'After';
  title: string;
  description: string;
  emotion: number; // 1-10
}

export interface MoSCoWItem {
  id: string;
  content: string;
  category: 'Must' | 'Should' | 'Could' | 'Won\'t';
}

export interface ProjectState {
  currentStep: StepId;
  itinerary: string;
  userStories: UserStory[];
  hiddenNeeds: HiddenNeed[];
  journeyMap: JourneyPoint[];
  moscow: MoSCoWItem[];
  blueprint: string;
  finalDocument: string;
  differentiation: string;
  pitch: string;
}

export const STEPS = [
  { id: 0, title: "Initial Itinerary", description: "Upload or paste the base model itinerary" },
  { id: 1, title: "User Stories", description: "Deconstruct itinerary into clear user needs" },
  { id: 2, title: "Hidden Needs", description: "Uncover the CEO's implicit requirements" },
  { id: 3, title: "Journey Map", description: "Design the emotional and cognitive path" },
  { id: 4, title: "MoSCoW", description: "Prioritize core values with surgical precision" },
  { id: 5, title: "Blueprint", description: "Integrate social, cultural, and academic layers" },
  { id: 6, title: "Elevator Pitch", description: "The 90-second winning presentation" },
];
