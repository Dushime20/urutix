import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BrokerOnboardingProgress {
  hasCompletedOnboarding: boolean;
  currentStep: number;
  completedSteps: number[];
  lastSeenDate: string | null;
  featureDiscoveries: {
    smartMatching?: boolean;
    cargoDiscovery?: boolean;
    dealFacilitation?: boolean;
    commissionTracking?: boolean;
    contractManagement?: boolean;
    escrowManagement?: boolean;
    marketIntelligence?: boolean;
  };
  loginCount: number;
}

interface BrokerOnboardingStore {
  progress: BrokerOnboardingProgress;
  setProgress: (progress: Partial<BrokerOnboardingProgress>) => void;
  completeStep: (step: number) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  discoverFeature: (feature: keyof BrokerOnboardingProgress['featureDiscoveries']) => void;
  incrementLoginCount: () => void;
  shouldShowOnboarding: () => boolean;
}

const initialProgress: BrokerOnboardingProgress = {
  hasCompletedOnboarding: false,
  currentStep: 0,
  completedSteps: [],
  lastSeenDate: null,
  featureDiscoveries: {},
  loginCount: 0,
};

export const useBrokerOnboardingStore = create<BrokerOnboardingStore>()(
  persist(
    (set, get) => ({
      progress: initialProgress,

      setProgress: (newProgress) =>
        set((state) => ({
          progress: { ...state.progress, ...newProgress },
        })),

      completeStep: (step) =>
        set((state) => ({
          progress: {
            ...state.progress,
            completedSteps: state.progress.completedSteps.includes(step)
              ? state.progress.completedSteps
              : [...state.progress.completedSteps, step],
            currentStep: step + 1,
          },
        })),

      completeOnboarding: () =>
        set((state) => ({
          progress: {
            ...state.progress,
            hasCompletedOnboarding: true,
            lastSeenDate: new Date().toISOString(),
          },
        })),

      skipOnboarding: () =>
        set((state) => ({
          progress: {
            ...state.progress,
            hasCompletedOnboarding: true,
            lastSeenDate: new Date().toISOString(),
          },
        })),

      resetOnboarding: () =>
        set(() => ({
          progress: { ...initialProgress, loginCount: get().progress.loginCount },
        })),

      discoverFeature: (feature) =>
        set((state) => ({
          progress: {
            ...state.progress,
            featureDiscoveries: {
              ...state.progress.featureDiscoveries,
              [feature]: true,
            },
          },
        })),

      incrementLoginCount: () =>
        set((state) => ({
          progress: {
            ...state.progress,
            loginCount: state.progress.loginCount + 1,
            lastSeenDate: new Date().toISOString(),
          },
        })),

      shouldShowOnboarding: () => {
        const { progress } = get();
        return (
          !progress.hasCompletedOnboarding &&
          progress.loginCount <= 3 // Show onboarding for first 3 logins
        );
      },
    }),
    {
      name: 'broker-onboarding-storage',
    }
  )
);

