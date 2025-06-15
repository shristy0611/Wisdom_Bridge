import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("============================================");
console.log("Wisdom Bridge - API Key Setup");
console.log("============================================");
console.log("You need a Google AI Gemini API key to run this app.");
console.log("If you don't have one, get it from: https://aistudio.google.com/app/apikey");
console.log("============================================");

rl.question('Paste your Gemini API key here: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log("No API key provided. Setup cancelled.");
    rl.close();
    return;
  }

  const envContent = `API_KEY=${apiKey.trim()}`;
  
  try {
    fs.writeFileSync('.env.local', envContent);
    console.log("API key saved successfully to .env.local");
    console.log("You can now run 'npm run dev' to start the app.");
  } catch (error) {
    console.error("Error saving API key:", error.message);
  }
  
  rl.close();
}); 