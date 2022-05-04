module.exports = {
	content: [
		"./index.html",
		"./src/**/*.{vue,js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			fontFamily: {
				redhat: ['Red Hat Text', 'open-sans', 'sans-serif'],
				"source-sans-pro": ["Source Sans Pro", 'open-sans', 'sans-serif'],
			},
			colors: {
				neutral: {
					850: "#222222",
				}
			}
		},
		screens: {
			'sm': '640px',
			// => @media (min-width: 640px) { ... }
	  
			'md': '768px',
			// => @media (min-width: 768px) { ... }
	  
			'lg': '1024px',
			// => @media (min-width: 1024px) { ... }
	  
			'xl': '1280px',
			// => @media (min-width: 1280px) { ... }
	  
			'2xl': '1536px',
			// => @media (min-width: 1536px) { ... }
		  }
	},
	plugins: [
		require('@tailwindcss/forms'),
	],
	darkMode: 'class',
}