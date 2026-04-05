import fs from 'fs';
import path from 'path';
import { config } from '../config';

const AUDIO_DIR = '/tmp/audio';
const RACHEL_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

function ensureAudioDir(): void {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
}

export async function generateAudio(
  text: string,
  storyId: string
): Promise<string> {
  ensureAudioDir();

  const outputPath = path.join(AUDIO_DIR, `${storyId}.mp3`);

  // If audio already exists for this story, return existing path
  if (fs.existsSync(outputPath)) {
    return `/audio/${storyId}.mp3`;
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${RACHEL_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': config.elevenlabs.apiKey,
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text.slice(0, 5000),
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs API error:', response.status, errorText);
    throw new Error(`ElevenLabs API returned ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(outputPath, buffer);

  return `/audio/${storyId}.mp3`;
}
