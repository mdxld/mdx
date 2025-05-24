import { Composition } from "remotion";
import { Main } from "./Main";

import { calculateMetadata } from "./calculate-metadata/calculate-metadata";
import { schema } from "./calculate-metadata/schema";

export const RemotionRoot = () => {
  return (
    <Composition
      id="Main"
      component={Main}
      defaultProps={{
        steps: null,
        themeColors: null,
        codeWidth: null,
        theme: "github-dark" as const,
        width: {
          type: "auto" as const,
        },
      }}
      fps={30}
      height={1080}
      calculateMetadata={calculateMetadata as any}
      schema={schema as any}
    />
  );
};
