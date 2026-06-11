/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	// Se escanean tanto carpetas heredadas como src para no perder clases en la compilación.
	content: [
		'./pages/**/*.{js,jsx}',
		'./components/**/*.{js,jsx}',
		'./layouts/**/*.{js,jsx}',
		'./src/**/*.{js,jsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			// Aquí conviven los colores de marca y los tokens genéricos usados por los componentes UI.
			colors: {
				syntix: {
					navy: '#08162E',
					blue: '#2563EB',
					accent: '#3B82F6',
					ice: '#7DD3FC',
					green: '#16805A',
					red: '#C2414C',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			boxShadow: {
				premium: '0 18px 45px -24px rgba(15, 23, 42, 0.28)',
				'premium-dark': '0 22px 55px -28px rgba(2, 6, 23, 0.72)',
			},
			fontFamily: {
				sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			},
		},
	},
	// tailwindcss-animate habilita utilidades ya usadas por modales y toasts del proyecto.
	plugins: [require('tailwindcss-animate')],
};
