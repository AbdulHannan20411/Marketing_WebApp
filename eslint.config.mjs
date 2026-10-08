import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

/**
 * Physical direction utilities break Urdu (RTL) layouts. Use logical ones instead:
 * ms/me, ps/pe, start/end, border-s/e, rounded-s/e, text-start/end.
 */
const PHYSICAL_CLASS =
  /(?:^|[\s:"'`])-?(?:ml|mr|pl|pr|left|right|border-l|border-r|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br|scroll-ml|scroll-mr|scroll-pl|scroll-pr)-|(?:^|[\s:"'`])text-(?:left|right)(?:$|[\s"'`])/;

const physicalClassMessage =
  "Use logical utilities (ms-/me-, ps-/pe-, start-/end-, border-s/e, rounded-s/e, text-start/end) so Urdu RTL works.";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "features/**/*.{ts,tsx}"],
    rules: {
      // All user-facing copy lives in messages/*.json.
      "react/jsx-no-literals": [
        "error",
        {
          noStrings: false,
          ignoreProps: true,
          allowedStrings: ["·", "/", "—", "*", "×", "+", "%"],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=${PHYSICAL_CLASS}]`,
          message: physicalClassMessage,
        },
        {
          selector: `TemplateElement[value.raw=${PHYSICAL_CLASS}]`,
          message: physicalClassMessage,
        },
      ],
    },
  },
  {
    // Server-only modules must never be imported by client code.
    files: ["components/**/*.tsx", "features/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/admin",
              message:
                "The service-role client is server-only. Use it in Server Actions or Route Handlers.",
            },
            {
              name: "@/lib/env/server",
              message:
                "Server secrets cannot be read from components. Pass values as props from the server.",
            },
          ],
        },
      ],
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);
