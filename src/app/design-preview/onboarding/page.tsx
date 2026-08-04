import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import { mockProfile } from "@/lib/design-mock-data";

export default function DesignPreviewOnboarding() {
  return <OnboardingScreen userId={mockProfile.id} />;
}
