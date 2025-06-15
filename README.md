# Wisdom Bridge

Wisdom Bridge is a React application that serves as a digital bridge to the wisdom contained in Daisaku Ikeda's "The New Human Revolution." The app allows users to search for quotes by theme and provides profound insights that can be applied to their daily lives.

![Wisdom Bridge](./screenshots/app-preview.png)

## Features

- **Theme-based Quote Search**: Find relevant quotes from "The New Human Revolution" based on keywords or themes
- **Quote of the Day**: Daily inspirational quotes to start your day with wisdom
- **Bilingual Support**: Switch between English and Japanese languages
- **Favorites Collection**: Save your favorite quotes for quick access
- **Personal Reflections**: Add your own reflections to meaningful quotes
- **Optimized Performance**: Enhanced caching to reduce latency and improve user experience

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Google Generative AI (Gemini API)

## Getting Started

### Prerequisites

- Node.js (latest LTS version recommended)
- A Google AI Gemini API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shristy0611/Wisdom_Bridge.git
   cd Wisdom_Bridge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your API key:
   ```bash
   npm run setup
   ```
   Or manually create a `.env.local` file with your API key:
   ```
   API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Building for Production

To create a production build:

```bash
npm run build
```

The compiled files will be available in the `dist` directory.

## License

[MIT](LICENSE)

## Acknowledgments

- Daisaku Ikeda for his profound wisdom in "The New Human Revolution"
- Google Generative AI for powering the quote search capabilities
