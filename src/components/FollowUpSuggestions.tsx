'use client';

interface Props {
  /** Which feature tab is showing */
  feature: 'preparedness' | 'checklist' | 'travel' | 'safety';
  /** Called with the selected question text */
  onSelect: (question: string) => void;
}

const SUGGESTIONS: Record<string, string[]> = {
  preparedness: [
    'What if I live on the ground floor near a river?',
    'How should I prepare if I have elderly family members?',
    'What emergency supplies should I stock for 7 days?',
    'How do I waterproof my home before monsoon?',
  ],
  checklist: [
    'Generate a checklist for a family with pets',
    'What items are critical for a flood evacuation kit?',
    'Post-monsoon cleanup — what should I check first?',
    'Hospital and emergency numbers I should save',
  ],
  travel: [
    'Is it safe to drive on the expressway during heavy rain?',
    'Best mode of travel during waterlogging in the city?',
    'Should I postpone my trip if rain is forecast?',
    'What should I keep in my car during monsoon?',
  ],
  safety: [
    'How to stay safe from electrocution during floods?',
    'What diseases spread during monsoon and how to prevent them?',
    'How to identify a landslide-prone area?',
    'Safety tips for children playing outside in rain',
  ],
};

/**
 * Shows contextual follow-up question chips that users can tap
 * to quickly explore related monsoon preparedness topics.
 */
export default function FollowUpSuggestions({ feature, onSelect }: Props) {
  const questions = SUGGESTIONS[feature] ?? [];
  if (!questions.length) return null;

  return (
    <div className="card bg-gradient-to-r from-monsoon-50 to-blue-50 border-monsoon-100">
      <p className="text-sm font-semibold text-monsoon-800 mb-3 flex items-center gap-1.5">
        <span>💡</span> Follow-up Questions
      </p>
      <div className="flex flex-wrap gap-2">
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="text-left text-sm px-3 py-2 bg-white hover:bg-monsoon-50 border border-monsoon-200
                       rounded-xl text-monsoon-700 transition-all hover:shadow-sm hover:scale-[1.01]
                       active:scale-[0.99]"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
