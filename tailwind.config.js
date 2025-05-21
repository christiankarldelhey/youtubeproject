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
			primary: '#2e3c50', // Text Gray (for contrast & readability)
			secondary: '#f8f7ff', // Soft violet (for secondary elements and hovers)
			accent: '#6639de', // Violet (for highlights)
			background: '#ffffff', // White (for background elements)
			foreground: '#86819a', // Gray (for text & UI elements)
  		},
		zIndex: {
			9998: '9998',
			9999: '9999',
			100001: '100001'
		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
  plugins: [require('@tailwindcss/line-clamp')],
}
