module.exports = {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            animation: {
                fadeInOverlay: 'fadeInOverlay 0.4s ease-out forwards',
                fadeInModal: 'fadeInModal 0.4s ease-out forwards',
            },
            keyframes: {
                fadeInOverlay: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                fadeInModal: {
                    from: {
                        opacity: '0',
                        transform: 'scale(0.9)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'scale(1)',
                    },
                },
            },
        },
    },
    plugins: [
        require('tailwind-scrollbar-hide'),
    ]

};
