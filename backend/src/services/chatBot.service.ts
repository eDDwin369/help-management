/**
 * Mock chatbot.
 *
 * Returns a canned response shaped like what a real LLM call would
 * eventually return. Isolated behind its own interface so the support
 * service depends on the contract, not the implementation — when we
 * swap this for a real LLM integration the service won't change.
 */

export interface ChatBotResponse {
  text: string;
  model: string;
  latencyMs: number;
}

export interface ChatBot {
  reply(userMessage: string): Promise<ChatBotResponse>;
}

const CANNED_RESPONSES = [
  "Thanks for reaching out! I've noted your question and will do my best to help.",
  "I understand your concern. Could you share a bit more detail so I can point you in the right direction?",
  "Got it — here's what usually helps in cases like this: try restarting the app and checking your network connection.",
  "Sorry you're running into trouble. A teammate will follow up if this doesn't resolve it.",
];

export const mockChatBot: ChatBot = {
  async reply(userMessage: string): Promise<ChatBotResponse> {
    const start = Date.now();

    // Deterministic-ish pick based on message length so tests don't flake.
    const idx = userMessage.length % CANNED_RESPONSES.length;
    const text = CANNED_RESPONSES[idx] ?? CANNED_RESPONSES[0]!;

    // Simulate a tiny bit of work so latency metrics aren't always 0.
    await new Promise((r) => setTimeout(r, 10));

    return {
      text,
      model: 'mock-bot-v1',
      latencyMs: Date.now() - start,
    };
  },
};
