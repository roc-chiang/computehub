import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
    ...nextVitals,
    {
        rules: {
            "react/no-unescaped-entities": "off",
            "react-hooks/immutability": "off",
            "react-hooks/purity": "off",
            "react-hooks/set-state-in-effect": "off",
            "react-hooks/static-components": "off",
        },
    },
    globalIgnores([".next/**", "node_modules/**", "next-env.d.ts"]),
]);
