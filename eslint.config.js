export default [
	{
		languageOptions: {
			parser: require("@typescript-eslint/parser"),
		},
		plugins: {
			"@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
		},
		rules: {
			semi: ["error", "always"],
			quotes: ["error", "double"],
		},
	},
];
