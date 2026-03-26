import { useState, useMemo } from 'preact/hooks';

interface CaliberInfo {
  name: string;
  slug: string;
  category: string;
  typical_energy_ft_lbs: [number, number];
  effective_range_yd: number;
  recoil_subjective: string;
  popularity_tier: string;
  cost_per_round_usd: [number, number];
  primary_use_cases: string[];
}

interface Props {
  calibers: CaliberInfo[];
  basePath: string;
}

type Step = 'purpose' | 'experience' | 'recoil' | 'range' | 'budget' | 'game' | 'results';

interface Answers {
  purpose: string;
  experience: string;
  recoil: string;
  range: string;
  budget: string;
  game: string;
}

const QUESTIONS: { step: Exclude<Step, 'results'>; question: string; options: { value: string; label: string; desc: string }[]; condition?: (a: Answers) => boolean }[] = [
  {
    step: 'purpose',
    question: 'What is your primary use case?',
    options: [
      { value: 'self-defense', label: 'Self-Defense / Home Defense', desc: 'Concealed carry or protecting the home' },
      { value: 'hunting', label: 'Hunting', desc: 'Taking game animals ethically' },
      { value: 'target', label: 'Target / Competition', desc: 'Range shooting, precision, or competitive disciplines' },
      { value: 'plinking', label: 'Recreational / Plinking', desc: 'Fun, affordable range time' },
      { value: 'long-range', label: 'Long-Range Precision', desc: 'Shooting at 500+ yards' },
    ],
  },
  {
    step: 'experience',
    question: 'What is your experience level?',
    options: [
      { value: 'beginner', label: 'Beginner', desc: 'New to firearms or minimal range time' },
      { value: 'intermediate', label: 'Intermediate', desc: 'Comfortable with fundamentals, some experience' },
      { value: 'advanced', label: 'Advanced', desc: 'Experienced shooter, can handle significant recoil' },
    ],
  },
  {
    step: 'recoil',
    question: 'How much recoil are you comfortable with?',
    options: [
      { value: 'minimal', label: 'Minimal', desc: 'I want the lightest recoil possible' },
      { value: 'moderate', label: 'Moderate', desc: 'Some kick is fine if it means better performance' },
      { value: 'heavy', label: 'Heavy is fine', desc: 'Performance matters more than comfort' },
    ],
  },
  {
    step: 'range',
    question: 'What engagement distance do you expect?',
    options: [
      { value: 'close', label: 'Close (under 50 yards)', desc: 'Self-defense, home defense, close-range hunting' },
      { value: 'medium', label: 'Medium (50–300 yards)', desc: 'Most hunting, general rifle shooting' },
      { value: 'long', label: 'Long (300–600 yards)', desc: 'Western hunting, long-range target' },
      { value: 'extreme', label: 'Extreme (600+ yards)', desc: 'ELR competition, precision rifle' },
    ],
  },
  {
    step: 'budget',
    question: 'What is your ammo budget sensitivity?',
    options: [
      { value: 'low', label: 'Budget-friendly', desc: 'Under $0.50/round — I want to shoot often' },
      { value: 'moderate', label: 'Moderate', desc: '$0.50–$1.50/round is acceptable' },
      { value: 'unlimited', label: 'Performance first', desc: 'Cost is not a primary concern' },
    ],
  },
  {
    step: 'game',
    question: 'What size game are you hunting?',
    condition: (a) => a.purpose === 'hunting',
    options: [
      { value: 'varmint', label: 'Varmint / Small Game', desc: 'Coyotes, prairie dogs, rabbits' },
      { value: 'medium', label: 'Medium Game', desc: 'Whitetail deer, pronghorn, feral hogs' },
      { value: 'large', label: 'Large Game', desc: 'Elk, moose, large bear' },
      { value: 'dangerous', label: 'Dangerous Game', desc: 'Grizzly, African big game' },
    ],
  },
];

const RECOIL_ORDER = ['very_low', 'low', 'moderate', 'heavy', 'very_heavy'];

function scoreCaliber(cal: CaliberInfo, answers: Answers): number {
  let score = 0;
  const avgEnergy = (cal.typical_energy_ft_lbs[0] + cal.typical_energy_ft_lbs[1]) / 2;
  const avgCost = (cal.cost_per_round_usd[0] + cal.cost_per_round_usd[1]) / 2;
  const recoilIdx = RECOIL_ORDER.indexOf(cal.recoil_subjective);

  // Purpose matching
  if (answers.purpose === 'self-defense') {
    if (cal.primary_use_cases.some(u => u.includes('self-defense') || u.includes('law enforcement') || u.includes('home defense'))) score += 30;
    if (['handgun', 'shotgun'].includes(cal.category)) score += 15;
    if (cal.category === 'pdw') score += 5;
  } else if (answers.purpose === 'hunting') {
    if (cal.primary_use_cases.some(u => u.includes('hunting'))) score += 30;
    if (['rifle', 'magnum_rifle', 'shotgun', 'magnum_handgun'].includes(cal.category)) score += 10;
  } else if (answers.purpose === 'target' || answers.purpose === 'plinking') {
    if (cal.primary_use_cases.some(u => u.includes('target') || u.includes('competition') || u.includes('plinking'))) score += 30;
    if (avgCost < 0.40) score += 15;
  } else if (answers.purpose === 'long-range') {
    if (cal.effective_range_yd >= 600) score += 30;
    if (cal.effective_range_yd >= 1000) score += 15;
    if (['rifle', 'magnum_rifle'].includes(cal.category)) score += 10;
  }

  // Recoil preference
  if (answers.recoil === 'minimal') {
    if (recoilIdx <= 1) score += 20;
    else if (recoilIdx === 2) score += 5;
    else score -= 15;
  } else if (answers.recoil === 'moderate') {
    if (recoilIdx <= 2) score += 15;
    else if (recoilIdx === 3) score += 5;
    else score -= 10;
  } else {
    if (recoilIdx >= 3) score += 10;
    score += 5;
  }

  // Range matching
  if (answers.range === 'close') {
    if (cal.effective_range_yd <= 100) score += 15;
    else if (cal.effective_range_yd <= 200) score += 5;
  } else if (answers.range === 'medium') {
    if (cal.effective_range_yd >= 100 && cal.effective_range_yd <= 500) score += 15;
  } else if (answers.range === 'long') {
    if (cal.effective_range_yd >= 300) score += 15;
    if (cal.effective_range_yd >= 500) score += 10;
  } else if (answers.range === 'extreme') {
    if (cal.effective_range_yd >= 600) score += 20;
    if (cal.effective_range_yd >= 1000) score += 10;
  }

  // Budget
  if (answers.budget === 'low') {
    if (avgCost < 0.35) score += 20;
    else if (avgCost < 0.75) score += 5;
    else score -= 10;
  } else if (answers.budget === 'moderate') {
    if (avgCost < 1.50) score += 10;
    else score -= 5;
  }

  // Experience level
  if (answers.experience === 'beginner') {
    if (recoilIdx <= 1) score += 10;
    if (['ubiquitous', 'very_common'].includes(cal.popularity_tier)) score += 10;
    if (recoilIdx >= 3) score -= 20;
  } else if (answers.experience === 'intermediate') {
    if (['ubiquitous', 'very_common', 'common'].includes(cal.popularity_tier)) score += 5;
  }

  // Game size (hunting only)
  if (answers.purpose === 'hunting' && answers.game) {
    if (answers.game === 'varmint') {
      if (avgEnergy < 300) score += 15;
      else if (avgEnergy < 1500) score += 5;
      else score -= 10;
    } else if (answers.game === 'medium') {
      if (avgEnergy >= 800 && avgEnergy <= 3500) score += 15;
      if (avgEnergy < 500) score -= 15;
    } else if (answers.game === 'large') {
      if (avgEnergy >= 1500) score += 15;
      if (avgEnergy >= 2500) score += 10;
      if (avgEnergy < 1200) score -= 20;
    } else if (answers.game === 'dangerous') {
      if (avgEnergy >= 3000) score += 20;
      if (avgEnergy >= 4000) score += 10;
      if (avgEnergy < 2500) score -= 30;
    }
  }

  // Popularity bonus (more available = easier to find ammo/support)
  const popBonus = { ubiquitous: 8, very_common: 5, common: 2, niche: -2, rare: -5 };
  score += popBonus[cal.popularity_tier as keyof typeof popBonus] ?? 0;

  return score;
}

function getRecommendationReason(cal: CaliberInfo, answers: Answers): string {
  const reasons: string[] = [];
  const avgCost = (cal.cost_per_round_usd[0] + cal.cost_per_round_usd[1]) / 2;

  if (answers.purpose === 'self-defense' && cal.primary_use_cases.some(u => u.includes('self-defense'))) {
    reasons.push('proven defensive cartridge');
  }
  if (answers.purpose === 'hunting' && cal.primary_use_cases.some(u => u.includes('hunting'))) {
    reasons.push('established hunting cartridge');
  }
  if (['ubiquitous', 'very_common'].includes(cal.popularity_tier)) {
    reasons.push('widely available ammo');
  }
  if (avgCost < 0.40 && answers.budget === 'low') {
    reasons.push('affordable to shoot');
  }
  if (cal.effective_range_yd >= 600 && ['long', 'extreme'].includes(answers.range)) {
    reasons.push(`effective to ${cal.effective_range_yd}+ yd`);
  }
  const recoilIdx = RECOIL_ORDER.indexOf(cal.recoil_subjective);
  if (recoilIdx <= 1 && answers.recoil === 'minimal') {
    reasons.push('very manageable recoil');
  }

  return reasons.slice(0, 3).join(' · ') || 'strong overall match';
}

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function CaliberQuiz({ calibers, basePath }: Props) {
  const [answers, setAnswers] = useState<Answers>({
    purpose: '', experience: '', recoil: '', range: '', budget: '', game: '',
  });
  const [currentStep, setCurrentStep] = useState<Step>('purpose');

  const activeQuestions = useMemo(() =>
    QUESTIONS.filter(q => !q.condition || q.condition(answers)),
    [answers]
  );

  const stepOrder = useMemo(() =>
    [...activeQuestions.map(q => q.step), 'results' as Step],
    [activeQuestions]
  );

  const currentIdx = stepOrder.indexOf(currentStep);
  const progress = currentStep === 'results' ? 100 : Math.round((currentIdx / (stepOrder.length - 1)) * 100);

  const currentQuestion = QUESTIONS.find(q => q.step === currentStep);

  function selectOption(step: Exclude<Step, 'results'>, value: string) {
    const newAnswers = { ...answers, [step]: value };
    setAnswers(newAnswers);

    // Auto-advance to next step
    const updatedQuestions = QUESTIONS.filter(q => !q.condition || q.condition(newAnswers));
    const updatedOrder = [...updatedQuestions.map(q => q.step), 'results' as Step];
    const idx = updatedOrder.indexOf(step);
    if (idx < updatedOrder.length - 1) {
      setCurrentStep(updatedOrder[idx + 1]);
    }
  }

  function goBack() {
    if (currentIdx > 0) {
      setCurrentStep(stepOrder[currentIdx - 1]);
    }
  }

  function restart() {
    setAnswers({ purpose: '', experience: '', recoil: '', range: '', budget: '', game: '' });
    setCurrentStep('purpose');
  }

  const results = useMemo(() => {
    if (currentStep !== 'results') return [];
    return calibers
      .map(cal => ({ cal, score: scoreCaliber(cal, answers) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [currentStep, answers, calibers]);

  return (
    <div class="border border-surface-border">
      {/* Progress bar */}
      <div class="h-1 bg-surface-overlay">
        <div
          class="h-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div class="p-6">
        {currentStep !== 'results' && currentQuestion ? (
          <div>
            <div class="flex items-center justify-between mb-6">
              <span class="font-mono text-xs text-text-muted uppercase tracking-wider">
                Question {currentIdx + 1} of {stepOrder.length - 1}
              </span>
              {currentIdx > 0 && (
                <button
                  onClick={goBack}
                  class="font-mono text-sm text-text-muted hover:text-accent transition-colors"
                >
                  ← Back
                </button>
              )}
            </div>

            <h3 class="font-display text-xl font-semibold text-text-primary mb-6">
              {currentQuestion.question}
            </h3>

            <div class="space-y-3">
              {currentQuestion.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => selectOption(currentQuestion.step, opt.value)}
                  class={`w-full text-left border px-4 py-3 transition-colors ${
                    answers[currentQuestion.step] === opt.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-surface-border bg-surface-raised text-text-secondary hover:border-accent/50 hover:text-text-primary'
                  }`}
                >
                  <div class="font-mono text-base font-medium">{opt.label}</div>
                  <div class="font-mono text-sm text-text-muted mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div class="flex items-center justify-between mb-6">
              <h3 class="font-display text-xl font-semibold text-accent">
                Your Top Recommendations
              </h3>
              <button
                onClick={restart}
                class="font-mono text-sm text-text-muted hover:text-accent transition-colors border border-surface-border px-3 py-1"
              >
                Start Over
              </button>
            </div>

            <div class="space-y-4">
              {results.map(({ cal, score }, i) => (
                <a
                  key={cal.slug}
                  href={`${basePath}/calibers/${cal.slug}`}
                  class="block border border-surface-border bg-surface-raised p-4 transition-colors hover:border-accent group"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <div class="flex items-center gap-3">
                        <span class="font-mono text-2xl font-bold text-accent">#{i + 1}</span>
                        <div>
                          <div class="font-mono text-lg font-medium text-text-primary group-hover:text-accent transition-colors">
                            {cal.name}
                          </div>
                          <div class="font-mono text-xs text-text-muted mt-0.5">
                            {getRecommendationReason(cal, answers)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <span class="border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-xs uppercase text-accent">
                        {titleCase(cal.category)}
                      </span>
                    </div>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm text-text-muted">
                    <span>Range: {cal.effective_range_yd} yd</span>
                    <span>Recoil: {titleCase(cal.recoil_subjective)}</span>
                    <span>Cost: ${cal.cost_per_round_usd[0].toFixed(2)}–${cal.cost_per_round_usd[1].toFixed(2)}/rd</span>
                  </div>
                </a>
              ))}
            </div>

            <div class="mt-6 flex gap-3">
              <button
                onClick={goBack}
                class="font-mono text-sm text-text-muted hover:text-accent transition-colors border border-surface-border px-4 py-2"
              >
                ← Adjust Answers
              </button>
              <a
                href={`${basePath}/compare?c=${results.map(r => r.cal.slug).join(',')}`}
                class="font-mono text-sm text-accent hover:underline border border-accent/30 bg-accent/10 px-4 py-2"
              >
                Compare Top Picks →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
