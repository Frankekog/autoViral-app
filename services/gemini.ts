import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { ScriptData, AspectRatio } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to write string to DataView
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// Helper to add WAV header to raw PCM data
const createWavBlob = (pcmData: Uint8Array, sampleRate: number): Blob => {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const chunkSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, chunkSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  const pcmBytes = new Uint8Array(buffer, 44);
  pcmBytes.set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
};

// 1. Generate Script & Visual Prompt
export const generateViralScript = async (
  topic: string, 
  duration: string,
  visualStyle: string,
  includeCaptions: boolean,
  includeThumbnail: boolean,
  customScript?: string
): Promise<ScriptData> => {
  const ai = getClient();
  
  const schemaProperties: any = {
      title: { type: Type.STRING, description: "A clickbait/viral title for the video" },
      // If custom script is provided, we won't ask Gemini to generate 'script'
      visualPrompt: { type: Type.STRING, description: `A detailed visual description for the video generation AI. Style: ${visualStyle}. Focus on movement, lighting, and subject.` },
      tags: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "5 viral tags for YouTube/TikTok"
      }
  };

  const required = ["title", "visualPrompt", "tags"];

  // If no custom script, we need Gemini to generate one
  if (!customScript) {
      schemaProperties.script = { type: Type.STRING, description: `The spoken script for the video. Target duration: ${duration}.` };
      required.push("script");
  }

  if (includeCaptions) {
    schemaProperties.captions = { type: Type.STRING, description: "SRT style or list of captions/subtitles for the video overlay." };
    required.push("captions");
  }

  if (includeThumbnail) {
    schemaProperties.thumbnailPrompt = { type: Type.STRING, description: `A high-quality, descriptive prompt for generating a viral YouTube thumbnail. Style: ${visualStyle}.` };
    required.push("thumbnailPrompt");
  }

  const schema: Schema = {
    type: Type.OBJECT,
    properties: schemaProperties,
    required: required
  };

  let prompt = "";

  if (customScript) {
      prompt = `Analyze the following video script provided by the user: 
      "${customScript}"
      
      Visual Style: "${visualStyle}".
      
      Tasks:
      1. Generate a viral/clickbait title suitable for this script.
      2. Generate a detailed purely visual description for the video generation AI (no text overlays description) that strictly adheres to the requested visual style.
      3. Generate 5 viral tags.
      ${includeCaptions ? "4. Generate accurate captions for the provided script." : ""}
      ${includeThumbnail ? "5. Generate a prompt for a thumbnail image." : ""}
      
      Do NOT rewrite the script. The script field is omitted from the response schema.`;
  } else {
      prompt = `Create a viral video plan for the topic: "${topic}". 
      Target Video Length: ${duration}.
      Visual Style: "${visualStyle}".
      The video should be engaging, high-energy, and suitable for social media.
      Provide a script for the voiceover and a purely visual description for the video generation AI that strictly adheres to the requested visual style.
      ${includeCaptions ? "Include captions text." : ""}
      ${includeThumbnail ? "Include a prompt for a thumbnail image." : ""}`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const text = response.text;
  if (!text) throw new Error("No script generated");
  
  const result = JSON.parse(text) as ScriptData;

  // Inject the custom script back into the result if we used one
  if (customScript) {
      result.script = customScript;
  }

  return result;
};

const VOICE_MAPPING: Record<string, string> = {
  'eleven_adam': 'Charon',   // Adam (Deep/Narrative) -> Charon
  'eleven_rachel': 'Kore',   // Rachel (Clear/Calm) -> Kore
  'eleven_antoni': 'Fenrir', // Antoni (Deep/Warm) -> Fenrir
  'eleven_bella': 'Zephyr',  // Bella (Soft/Young) -> Zephyr
  'eleven_josh': 'Fenrir',   // Josh (Deep/Resonant) -> Fenrir
};

// 2. Generate Voiceover (TTS)
export const generateVoiceover = async (text: string, voiceName: string): Promise<string> => {
  const ai = getClient();
  
  // Map simulated voices to actual Gemini voices
  const effectiveVoice = VOICE_MAPPING[voiceName] || voiceName;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: effectiveVoice }, // Dynamic voice selection
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  // Decode Base64 to binary
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Create WAV blob (24kHz is standard for this model) with header so <audio> tag can play it
  const wavBlob = createWavBlob(bytes, 24000);
  return URL.createObjectURL(wavBlob); 
};

// 3. Generate Video (Veo)
export const generateVideo = async (
  prompt: string, 
  aspectRatio: AspectRatio, 
  onProgress: (msg: string) => void
): Promise<string> => {
  const ai = getClient();
  
  onProgress("Initializing generation request...");
  
  // Note: Using fast-generate-preview for speed in this demo
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    }
  });

  onProgress("Rendering video (this may take 1-2 minutes)...");

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
    onProgress("Still rendering... Artificial Intelligence is painting pixels...");
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  if (operation.error) {
    throw new Error(`Video generation failed: ${operation.error.message}`);
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("No video URI in response");

  // Fetch with API key to get the actual blob
  onProgress("Downloading final video...");
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!response.ok) throw new Error("Failed to download video bytes");
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

// 4. Generate Thumbnail (Imagen/Gemini Image)
export const generateThumbnail = async (prompt: string): Promise<string> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }]
        }
    });
    
    // Iterate parts to find the inline data
    let base64Data = null;
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                base64Data = part.inlineData.data;
                break;
            }
        }
    }
    
    if (!base64Data) throw new Error("No thumbnail generated");
    return `data:image/png;base64,${base64Data}`;
};

export const checkApiKey = async (): Promise<boolean> => {
  const win = window as any;
  if (typeof win.aistudio !== 'undefined' && win.aistudio.hasSelectedApiKey) {
    return await win.aistudio.hasSelectedApiKey();
  }
  return false;
};

export const requestApiKey = async (): Promise<void> => {
   const win = window as any;
   if (typeof win.aistudio !== 'undefined' && win.aistudio.openSelectKey) {
    await win.aistudio.openSelectKey();
  }
}