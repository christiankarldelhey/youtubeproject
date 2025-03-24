/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{ts,js,vue}', "./src/style.css"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
			primary: '#2c3e50', // Deep slate blue (for contrast & readability)
			secondary: '#8699a0', // Soft neutral blue-gray (for secondary elements)
			accent: '#d47b54', // Warm muted orange (for highlights)
			background: '#f2f3f1', // Very light gray (for background elements)
			foreground: '#c3c9cc', // Soft gray-blue (for text & UI elements)
  		},
		zIndex: {
			9999: '9999',
		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
  plugins: [require('@tailwindcss/line-clamp')],
}
