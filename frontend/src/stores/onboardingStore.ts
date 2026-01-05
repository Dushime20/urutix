import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProgress {
  hasCompletedOnboarding: boolean;
  hasCreatedFirstCargo: boolean;
  hasUsedSmartMatching: boolean;
  hasUsedBidding: boolean;
  hasTrackedShipment: boolean;
  hasMadePayment: boolean;
  tourStepsCompleted: string[];
  featuresDiscovered: string[];
  lastLoginDate: string;
  loginCount: number;
}

interface OnboardingState {
  userProgress: UserProgress;
  showOnboarding: boolean;
  currentFeatureHighlight: string | null;
  dismissedTips: string[];
  
  // Actions
  completeOnboarding: () => void;
  markFeatureDiscovered: (feature: string) => void;
  completeTourStep: (step: string) => void;
  showFeatureHighlight: (feature: string) => void;
  hideFeatureHighlight: () => void;
  dismissTip: (tipId: string) => void;
  updateProgress: (key: keyof UserProgress, value: any) => void;
  resetProgress: () => void;
  incrementLogin: () => void;
}

const initialProgress: UserProgress = {
  hasCompletedOnboarding: false,
  hasCreatedFirstCargo: false,
  hasUsedSmartMatching: false,
  hasUsedBidding: false,
  hasTrackedShipment: false,
  hasMadePayment: false,
  tourStepsCompleted: [],
  featuresDiscovered: [],
  lastLoginDate: new Date().toISOString(),
  loginCount: 0
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      userProgress: initialProgress,
      showOnboarding: true,
      currentFeatureHighlight: null,
      dismissedTips: [],

      completeOnboarding: () =>
        set((state) => ({
          userProgress: { ...state.userProgress, hasCompletedOnboarding: true },
          showOnboarding: false
        })),

      markFeatureDiscovered: (feature: string) =>
        set((state) => {
          if (state.userProgress.featuresDiscovered.includes(feature)) {
            return state;
          }
          return {
            userProgress: {
              ...state.userProgress,
              featuresDiscovered: [...state.userProgress.featuresDiscovered, feature]
            }
          };
        }),

      completeTourStep: (step: string) =>
        set((state) => {
          if (state.userProgress.tourStepsCompleted.includes(step)) {
            return state;
          }
          return {
            userProgress: {
              ...state.userProgress,
              tourStepsCompleted: [...state.userProgress.tourStepsCompleted, step]
            }
          };
        }),

      showFeatureHighlight: (feature: string) =>
        set({ currentFeatureHighlight: feature }),

      hideFeatureHighlight: () =>
        set({ currentFeatureHighlight: null }),

      dismissTip: (tipId: string) =>
        set((state) => ({
          dismissedTips: [...state.dismissedTips, tipId]
        })),

      updateProgress: (key: keyof UserProgress, value: any) =>
        set((state) => ({
          userProgress: { ...state.userProgress, [key]: value }
        })),

      resetProgress: () =>
        set({
          userProgress: initialProgress,
          showOnboarding: true,
          currentFeatureHighlight: null,
          dismissedTips: []
        }),

      incrementLogin: () =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            loginCount: state.userProgress.loginCount + 1,
            lastLoginDate: new Date().toISOString()
          }
        }))
    }),
    {
      name: 'urutix-onboarding-storage'
    }
  )
);

// Helper hooks
export const useUserProgress = () => {
  const progress = useOnboardingStore((state) => state.userProgress);
  return progress;
};

export const useShouldShowOnboarding = () => {
  const { hasCompletedOnboarding, loginCount } = useOnboardingStore((state) => state.userProgress);
  const showOnboarding = useOnboardingStore((state) => state.showOnboarding);
  
  // Show onboarding if:
  // 1. User hasn't completed it
  // 2. It's their first 3 logins
  // 3. Manual trigger is enabled
  return !hasCompletedOnboarding && loginCount < 3 && showOnboarding;
};

export const useShouldShowFeatureTip = (tipId: string) => {
  const dismissedTips = useOnboardingStore((state) => state.dismissedTips);
  return !dismissedTips.includes(tipId);
};

