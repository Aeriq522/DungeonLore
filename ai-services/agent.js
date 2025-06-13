// agent.js (ESModule-compatible)
import OpenAI from 'openai';
import summarizePrompt from './prompts/summarize_prompt.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Summarizes a D&D session using the selected model
 * @param {string} transcript - Notion summary or raw session text
 * @param {object} options - Optional config
 * @param {boolean} options.useMini - Use GPT-4o-mini instead of full GPT-4o
 * @returns {object|null} Parsed JSON summary or null on failure
 */
export async function summarizeSession(transcript, { useMini = false } = {}) {
  const prompt = summarizePrompt(transcript);
  const model = useMini ? 'gpt-4o-mini' : 'gpt-4o';

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    });

    const reply = completion.choices[0].message.content;
    const start = reply.indexOf('{');
    const end = reply.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const jsonBlock = reply.substring(start, end + 1);
      return JSON.parse(jsonBlock);
    } else {
      console.error('❌ Could not locate JSON object in reply:\n', reply);
      return null;
    }
  } catch (err) {
    console.error('❌ JSON parse error or OpenAI API error:\n', err);
    return null;
  }
}
