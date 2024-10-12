// api.ts
import OpenAI from 'openai';

const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const ASSISTANT_ID = 'asst_naz6Q0xwo3heDClknvL3EvGL';

const openai = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true // Nur für Entwicklungszwecke. In Produktion sollten Sie einen Server-Endpunkt verwenden.
});

interface UploadedDocument {
  name: string;
  content: string;
  type: string;
}

export async function* fetchGPTResponseStream(prompt: string, uploadedDocuments: UploadedDocument[] = []): AsyncGenerator<string, void, unknown> {
  if (!API_KEY) {
    throw new Error('OpenAI API key is not set');
  }

  try {
    const thread = await openai.beta.threads.create();

    // Fügen Sie zuerst die hochgeladenen Dokumente hinzu
    for (const doc of uploadedDocuments) {
      let content = doc.content;
      if (doc.type.startsWith('image/')) {
        content = `[Ein Bild wurde hochgeladen: ${doc.name}]`;
      }
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `Uploaded document: ${doc.name}\n\nContent: ${content}`
      });
    }

    // Fügen Sie dann die Benutzeranfrage hinzu
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: prompt
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });

    while (true) {
      const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      if (runStatus.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const assistantMessage = messages.data.find(message => message.role === 'assistant');
        if (assistantMessage && assistantMessage.content[0].type === 'text') {
          yield assistantMessage.content[0].text.value;
        }
        break;
      } else if (runStatus.status === 'failed') {
        throw new Error('Assistant run failed');
      }

      // Wait for a short time before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Error fetching GPT response stream:', error);
    yield `Es tut mir leid, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage. Bitte versuchen Sie es später erneut.`;
  }
}