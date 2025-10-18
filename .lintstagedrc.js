const path = require("path");

// Use ESLint CLI with explicit config path
const buildNextEslintCommand = (filenames) => {
  const eslintConfig = path.join(process.cwd(), "packages/nextjs/eslint.config.mjs");
  // Filter out auto-generated files that shouldn't be linted
  const files = filenames
    .filter((f) => !f.endsWith("next-env.d.ts"))
    .join(" ");
  return `eslint --config ${eslintConfig} --fix ${files}`;
};

const checkTypesNextCommand = () => "pnpm next:check-types";

const buildHardhatEslintCommand = (filenames) =>
  `pnpm hardhat:lint-staged --fix ${filenames
    .map((f) => path.relative(path.join("packages", "hardhat"), f))
    .join(" ")}`;

module.exports = {
  "packages/nextjs/**/*.{ts,tsx}": [
    buildNextEslintCommand,
    checkTypesNextCommand,
  ],
  "packages/hardhat/**/*.{ts,tsx}": [buildHardhatEslintCommand],
};
