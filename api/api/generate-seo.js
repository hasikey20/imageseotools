import OpenAI from '@openai/openai';

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Main serverless function handler
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { image, platform, prompt: userPrompt } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'Image data is required.' });
        }

        // This is the core prompt engineering part.
        // We instruct the AI on its role, the context, and the desired output format.
        const systemPrompt = `
You are an expert SEO metadata generator for stock photo platforms like Adobe Stock, Shutterstock, and Freepik. Your task is to analyze an image and generate a compelling title, relevant keywords, and a concise description based on the user's requirements.

**Instructions:**
1.  **Analyze the Image:** Carefully examine the subject, colors, mood, and potential concepts in the image.
2.  **Generate Title:** Create a descriptive and commercially appealing title. It should be between 8 and 15 words.
3.  **Generate Keywords:** Provide a list of 20-40 relevant keywords, separated by commas. Include a mix of specific and conceptual keywords. Do not use numbers or special characters in keywords.
4.  **Generate Description:** Write a 2-3 sentence description that accurately describes the image and its potential uses.
5.  **Platform Context:** The target platform is "${platform}". Tailor the tone and length slightly if needed, but follow the general rules.
6.  **User's Custom Prompt:** If the user provides a custom prompt, give it higher priority in your analysis. User's prompt is: "${userPrompt || 'No custom prompt provided.'}"

**Output Format:**
You MUST respond in the following format, with each section clearly marked. Do not add any other text or explanations.

TITLE: [Your generated title here]
KEYWORDS: [Your generated keywords here, comma-separated]
DESCRIPTION: [Your generated description here]
        `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4-vision-preview',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: systemPrompt },
                        {
                            type: 'image_url',
                            image_url: {
                                url: image, // The Base64 encoded image with data URI
                                detail: 'low' // Use 'low' for faster processing and lower cost
                            },
                        },
                    ],
                },
            ],
            max_tokens: 500, // Limit the response size
        });
        
        const aiResponseText = response.choices[0].message.content;

        // Parse the structured response from the AI
        const parsedData = parseAIResponse(aiResponseText);

        res.status(200).json(parsedData);

    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        res.status(500).json({ error: 'Failed to generate metadata from AI.' });
    }
}

// Helper function to parse the AI's structured text response
function parseAIResponse(text) {
    const titleMatch = text.match(/TITLE:\s*(.*)/);
    const keywordsMatch = text.match(/KEYWORDS:\s*(.*)/);
    const descriptionMatch = text.match(/DESCRIPTION:\s*(.*)/);

    return {
        title: titleMatch ? titleMatch[1].trim() : '',
        keywords: keywordsMatch ? keywordsMatch[1].trim() : '',
        description: descriptionMatch ? descriptionMatch[1].trim() : '',
    };
}
