/**
 * Voice-to-Text Integration
 * Web Speech API wrapper for voice note capture in noisy factory environments
 */

export interface VoiceToTextOptions {
  continuous?: boolean; // Keep listening after pause
  interimResults?: boolean; // Return results before final
  language?: string; // Default: 'en-US'
  maxAlternatives?: number; // Number of alternative results
}

export interface VoiceToTextResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

/**
 * Check if Web Speech API is supported
 */
export function isVoiceToTextSupported(): boolean {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
}

/**
 * Start voice recognition
 */
export async function startVoiceToText(
  onResult: (result: VoiceToTextResult) => void,
  onError?: (error: string) => void,
  options: VoiceToTextOptions = {}
): Promise<() => void> {
  if (!isVoiceToTextSupported()) {
    onError?.('Voice recognition is not supported in this browser');
    return () => {}; // Return no-op stop function
  }

  const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = options.continuous ?? false;
  recognition.interimResults = options.interimResults ?? true;
  recognition.lang = options.language ?? 'en-US';
  recognition.maxAlternatives = options.maxAlternatives ?? 1;

  recognition.onresult = (event: any) => {
    const last = event.results.length - 1;
    const result = event.results[last];
    const transcript = result[0].transcript;
    const confidence = result[0].confidence;
    const isFinal = result.isFinal;

    onResult({
      transcript,
      confidence,
      isFinal,
    });
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    onError?.(event.error);
  };

  recognition.onend = () => {
    console.log('Speech recognition ended');
  };

  try {
    recognition.start();
    console.log('Speech recognition started');

    // Return stop function
    return () => {
      recognition.stop();
      console.log('Speech recognition stopped');
    };
  } catch (error) {
    console.error('Error starting speech recognition:', error);
    onError?.(String(error));
    return () => {};
  }
}

/**
 * Get single voice note (stops after first final result)
 */
export function getSingleVoiceNote(
  onComplete: (transcript: string) => void,
  onError?: (error: string) => void
): () => void {
  let stop: (() => void) | null = null;

  const handleResult = (result: VoiceToTextResult) => {
    if (result.isFinal) {
      onComplete(result.transcript);
      stop?.(); // Auto-stop after final result
    }
  };

  startVoiceToText(handleResult, onError, {
    continuous: false,
    interimResults: true,
  }).then((stopFn) => {
    stop = stopFn;
  });

  return () => stop?.();
}
