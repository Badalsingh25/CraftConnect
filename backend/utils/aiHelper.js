import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

// Resolve the API client lazily to ensure dotenv has loaded
function getGenAIOrThrow() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables. Please set your Google Gemini API key.');
  }
  return new GoogleGenerativeAI(key);
}

export const generateAIContent = async (productName) => {
  console.log("Generating AI content for:", productName);

  const genAI = getGenAIOrThrow();

  try {
    const prompt = `Generate content for a handmade craft product called "${productName}".
    
Please provide the following in this exact format:

DESCRIPTION: [1-2 sentence marketing description]
STORY: [2-3 sentence heritage/cultural background story]
CAPTION: [Social media caption with 3-5 relevant hashtags]`;

    // Try models with fallback chain
    const candidateModels = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.0-pro'
    ];

    let text = '';
    let lastError = null;
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        if (text && text.trim().length > 0) {
          console.log(`Gemini succeeded with model: ${modelName}`);
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Gemini model failed: ${modelName}`, err?.message || err);
      }
    }

    if (!text || text.trim().length === 0) {
      throw new Error(lastError?.message || 'No text returned from Gemini');
    }
    console.log("Raw AI response:", text);

    // Parse the response - only use what Gemini returns
    let description = "";
    let story = "";
    let caption = "";

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('DESCRIPTION:')) {
        description = line.replace('DESCRIPTION:', '').trim();
      } 
      else if (line.startsWith('STORY:')) {
        story = line.replace('STORY:', '').trim();
      }
      else if (line.startsWith('CAPTION:')) {
        caption = line.replace('CAPTION:', '').trim();
      }
      // Also check for variations in formatting
      else if (line.toLowerCase().includes('description:') && !description) {
        description = line.replace(/.*description:\s*/i, '').trim();
      }
      else if (line.toLowerCase().includes('story:') && !story) {
        story = line.replace(/.*story:\s*/i, '').trim();
      }
      else if (line.toLowerCase().includes('caption:') && !caption) {
        caption = line.replace(/.*caption:\s*/i, '').trim();
      }
    }

    // If parsing didn't extract all parts, use the raw text intelligently
    if (!description || !story || !caption) {
      const sections = text.split(/\n\s*\n/).filter(section => section.trim().length > 0);
      
      if (sections.length >= 3) {
        description = sections[0].trim();
        story = sections[1].trim();
        caption = sections[2].trim();
      } else if (sections.length === 2) {
        description = sections[0].trim();
        story = sections[1].trim();
        caption = `Check out this beautiful ${productName}! #Handmade #${productName.replace(/\s+/g, '')}`;
      } else if (sections.length === 1) {
        description = sections[0].trim();
        story = `This ${productName} is crafted with traditional techniques and cultural heritage.`;
        caption = `Amazing handcrafted ${productName}! #ArtisanMade`;
      }
    }

    // Validate that we have content
    if (!description) throw new Error("No description generated");
    if (!story) throw new Error("No story generated");
    if (!caption) throw new Error("No caption generated");

    console.log("Parsed result:", { description, story, caption });

    return {
      description,
      story,
      caption
    };

  } catch (error) {
    console.error("AI generation failed completely:", error.message);
    throw new Error(`AI content generation failed: ${error.message}`);
  }
};

export const generateAIContentFromImage = async (imageFilePath, productNameHint = "") => {
  const genAI = getGenAIOrThrow();

  // Read image as base64
  const fileBuffer = await fs.readFile(imageFilePath);
  const base64Data = fileBuffer.toString('base64');
  const ext = path.extname(imageFilePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg';

  const prompt = `You are helping an artisan marketplace describe a handcrafted product from a photo.
Please provide the following in this exact format:

DESCRIPTION: [1-2 sentence marketing description]
STORY: [2-3 sentence heritage/cultural background story]
CAPTION: [Social media caption with 3-5 relevant hashtags]

${productNameHint ? `Product name hint: "${productNameHint}"` : ''}`;

  // Try models with fallback
  const candidateModels = [
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.0-pro'
  ];

  let text = '';
  let lastError = null;
  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            data: base64Data,
            mimeType: mime,
          },
        },
      ]);
      const response = await result.response;
      text = response.text();
      if (text && text.trim().length > 0) {
        break;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!text || text.trim().length === 0) {
    throw new Error(lastError?.message || 'No text returned from Gemini for image');
  }

  let description = '';
  let story = '';
  let caption = '';

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('DESCRIPTION:')) {
      description = line.replace('DESCRIPTION:', '').trim();
    } else if (line.startsWith('STORY:')) {
      story = line.replace('STORY:', '').trim();
    } else if (line.startsWith('CAPTION:')) {
      caption = line.replace('CAPTION:', '').trim();
    } else if (line.toLowerCase().includes('description:') && !description) {
      description = line.replace(/.*description:\s*/i, '').trim();
    } else if (line.toLowerCase().includes('story:') && !story) {
      story = line.replace(/.*story:\s*/i, '').trim();
    } else if (line.toLowerCase().includes('caption:') && !caption) {
      caption = line.replace(/.*caption:\s*/i, '').trim();
    }
  }

  if (!description || !story || !caption) {
    const sections = text.split(/\n\s*\n/).filter(s => s.trim().length > 0);
    if (sections.length >= 3) {
      description = description || sections[0].trim();
      story = story || sections[1].trim();
      caption = caption || sections[2].trim();
    }
  }

  if (!description) description = `Beautiful handcrafted ${productNameHint || 'product'}.`;
  if (!story) story = `Lovingly made by artisans, reflecting cultural heritage and skill.`;
  if (!caption) caption = `Discover artisan craft. #ArtisanMade #Handcrafted`;

  return { description, story, caption };
};