/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                green: '#10B981',  // Équivalent à green-500
                red: '#EF4444',    // Équivalent à red-500
                blue: '#3B82F6',   // Équivalent à blue-500
                purple: '#8B5CF6', // Équivalent à purple-500
            },
        },
    },
    plugins: [],
}
