// Use native fetch

async function testOllama() {
  const prompt = `You are an expert on Daisaku Ikeda's 'The New Human Revolution'. Provide one inspirational quote from the book, its citation, and a brief analysis. Output ONLY the JSON object in this format:
{
  "quote": "The quote text",
  "citation": "Citation (e.g., Vol. 1, 'Sunrise' Chapter, p.XX)",
  "analysis": "Analysis text"
}`;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3:latest',
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw Ollama response:');
    console.log(data.response);
    
    // Try to extract JSON
    const jsonRegex = /```json\s*([\s\S]*?)\s*```|^\s*(\{[\s\S]*\})\s*$/m;
    const match = data.response.match(jsonRegex);
    let jsonStr = match ? (match[1] || match[2]) : data.response;
    
    try {
      const parsed = JSON.parse(jsonStr);
      console.log('\nParsed JSON:');
      console.log(JSON.stringify(parsed, null, 2));
      
      // Validate fields
      if (parsed.quote && parsed.citation && parsed.analysis) {
        console.log('\n✅ SUCCESS: Valid quote object with all required fields');
      } else {
        console.log('\n❌ ERROR: Missing required fields');
        console.log('Has quote:', !!parsed.quote);
        console.log('Has citation:', !!parsed.citation);
        console.log('Has analysis:', !!parsed.analysis);
      }
    } catch (e) {
      console.log('\n❌ ERROR: Failed to parse JSON');
      console.error(e);
    }
  } catch (error) {
    console.error('Error calling Ollama:', error);
  }
}

testOllama(); 