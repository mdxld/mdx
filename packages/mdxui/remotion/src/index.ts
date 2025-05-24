import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
import { Main } from "./Main";
import { NarrationSequence } from "./NarrationSequence";
import { useNarrationAudio } from "./hooks/useNarrationAudio";

// Register the root component
registerRoot(RemotionRoot);

// Export components for external use
export { Main, NarrationSequence, useNarrationAudio };
