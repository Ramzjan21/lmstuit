const DEFAULT_AI_API_URL = import.meta.env.VITE_AI_API_URL || 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini';

const extractReplyText = (data) => {
  const first = data?.choices?.[0];

  if (typeof first?.message?.content === 'string') {
    return first.message.content.trim();
  }

  if (Array.isArray(first?.message?.content)) {
    const textPart = first.message.content.find((part) => part?.type === 'text');
    if (textPart?.text) return String(textPart.text).trim();
  }

  if (typeof first?.text === 'string') {
    return first.text.trim();
  }

  return null;
};

export const aiService = {
  async getReply({ conversation, userName }) {
    const apiKey = import.meta.env.VITE_AI_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: 'AI token topilmadi. .env.local faylida VITE_AI_API_KEY bo\'lishi kerak.'
      };
    }

    try {
      const response = await fetch(DEFAULT_AI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          temperature: 0.6,
          messages: [
            {
              role: 'system',
              content: [
                'You are an academic assistant for a timetable app used by university students.',
                `The current user name is: ${userName || 'Talaba'}.`,
                'Always answer in Uzbek language (latin script).',
                'Be concise, practical, and supportive.',
                'When needed, suggest checking timetable, tasks, grades, library, or LMS sync sections in the app.'
              ].join(' ')
            },
            ...conversation
          ]
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: data?.error?.message || 'AI serverga ulanishda xatolik.'
        };
      }

      const text = extractReplyText(data);

      if (!text) {
        return {
          success: false,
          error: 'AI javobini o\'qib bo\'lmadi. API formatini tekshiring.'
        };
      }

      return { success: true, message: text };
    } catch (error) {
      console.error('AI request error:', error);
      return {
        success: false,
        error: 'AI serverga ulanishda xatolik. URL, model yoki tokenni tekshiring.'
      };
    }
  }
};
