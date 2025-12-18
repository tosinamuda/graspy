'use client';

import { useEffect, useMemo, useState } from 'react';

type FlowField = 'language' | 'country' | 'grade';

type FlowStep =
  | { type: 'input'; field: FlowField; duration: number }
  | { type: 'loading'; duration: number }
  | { type: 'subjects'; duration: number }
  | { type: 'topic'; duration: number }
  | { type: 'chat'; duration: number };

type FlowScene = {
  persona: {
    language: string;
    country: string;
    grade: string;
  };
  subjects: string[];
  selectedSubjectIndex: number;
  topic: {
    focus: string;
    headline: string;
    summary: string;
    activities: { label: string; description: string }[];
  };
  chat: { speaker: 'mentor' | 'learner'; text: string }[];
};

const TIMELINE: FlowStep[] = [
  { type: 'input', field: 'language', duration: 1800 },
  { type: 'input', field: 'country', duration: 1700 },
  { type: 'input', field: 'grade', duration: 1700 },
  { type: 'loading', duration: 1400 },
  { type: 'subjects', duration: 2300 },
  { type: 'topic', duration: 3200 },
  { type: 'chat', duration: 3600 },
];

const STAGE_ORDER = ['inputs', 'subjects', 'topic', 'chat'] as const;
const STAGE_LABELS: Record<(typeof STAGE_ORDER)[number], string> = {
  inputs: 'Setup',
  subjects: 'Subjects',
  topic: 'Lesson',
  chat: 'Mentor chat',
};

const SCENES: FlowScene[] = [
  {
    persona: {
      language: 'Kiswahili',
      country: 'Kenya',
      grade: 'Primary 6',
    },
    subjects: ['Mathematics', 'Science', 'Life Skills', 'Stories'],
    selectedSubjectIndex: 0,
    topic: {
      focus: 'Math • Primary 6',
      headline: 'Exploring fractions with favorite meals',
      summary: 'Split chapati and stew fairly so everyone enjoys a full share.',
      activities: [
        {
          label: 'Watch',
          description: 'Quick explainer filmed at the local market.',
        },
        {
          label: 'Practice',
          description: 'Offline fraction questions that sync later.',
        },
      ],
    },
    chat: [
      { speaker: 'mentor', text: "Ready to split today's meal using fractions?" },
      {
        speaker: 'learner',
        text: 'If we have 3 chapati for 4 friends, how much does each get?',
      },
      {
        speaker: 'mentor',
        text: 'Each friend gets 3/4 of a chapati. Want to see the slices?',
      },
    ],
  },
  {
    persona: {
      language: 'Luganda',
      country: 'Uganda',
      grade: 'Primary 5',
    },
    subjects: ['Numeracy', 'Literacy', 'Life skills', 'Creative arts'],
    selectedSubjectIndex: 1,
    topic: {
      focus: 'Literacy • Primary 5',
      headline: 'Reading a story from Kampala taxi park',
      summary: 'Meet Kampala taxi park storytellers and respond in Luganda.',
      activities: [
        {
          label: 'Listen',
          description: 'Audio narration voiced by a Kampala teller.',
        },
        {
          label: 'Reflect',
          description: 'Quick prompts to link the story to daily life.',
        },
      ],
    },
    chat: [
      { speaker: 'mentor', text: "Let's explore the new Luganda story together." },
      {
        speaker: 'learner',
        text: 'What does the conductor mean by "tuli muwala"?',
      },
      {
        speaker: 'mentor',
        text: 'It means "we are almost there." Want to practice saying it?',
      },
    ],
  },
  {
    persona: {
      language: 'French',
      country: "Cote d'Ivoire",
      grade: 'Troisieme',
    },
    subjects: ['Mathematiques', 'Sciences', 'Histoire', 'Competences de vie'],
    selectedSubjectIndex: 2,
    topic: {
      focus: 'Histoire • Troisieme',
      headline: 'Cartographier les royaumes ouest-africains',
      summary:
        "Suivre les routes commerciales reliant Timbuktu, Kong et la cote pour voir leur impact.",
      activities: [
        {
          label: 'Explorer',
          description: 'Carte legere avec principaux reperes historiques.',
        },
        {
          label: 'Discussion',
          description: 'Questions rapides pour comparer avec aujourd’hui.',
        },
      ],
    },
    chat: [
      {
        speaker: 'mentor',
        text: "Quelle region veux-tu visiter sur la carte aujourd'hui ?",
      },
      {
        speaker: 'learner',
        text: 'Je veux suivre la route du sel vers Timbuktu.',
      },
      {
        speaker: 'mentor',
        text: 'Regarde comment le commerce reliait les villes. On en discute ?',
      },
    ],
  },
];

function classNames(...classes: Array<string | null | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

function StepLabel({ step }: { step: FlowStep }) {
  switch (step.type) {
    case 'input': {
      if (step.field === 'language') return <span>Choose language</span>;
      if (step.field === 'country') return <span>Pick country</span>;
      return <span>Set grade level</span>;
    }
    case 'loading':
      return <span>Generating subjects</span>;
    case 'subjects':
      return <span>Subjects ready</span>;
    case 'topic':
      return <span>Building lesson</span>;
    case 'chat':
      return <span>AI Tutor chat</span>;
    default:
      return null;
  }
}

export function AutoFlowShowcase() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeSubjectIndex, setActiveSubjectIndex] = useState<number>(-1);
  const [chatMessagesVisible, setChatMessagesVisible] = useState(0);

  const currentScene = useMemo(() => SCENES[sceneIndex], [sceneIndex]);
  const currentStep = TIMELINE[stepIndex];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setStepIndex(prev => {
        if (prev === TIMELINE.length - 1) {
          setSceneIndex(scene => (scene + 1) % SCENES.length);
          return 0;
        }
        return prev + 1;
      });
    }, currentStep.duration);

    return () => window.clearTimeout(timeout);
  }, [stepIndex, currentStep.duration]);

  useEffect(() => {
    setActiveSubjectIndex(-1);
    setChatMessagesVisible(0);
  }, [sceneIndex]);

  useEffect(() => {
    if (currentStep.type === 'subjects') {
      const targetIndex = currentScene.selectedSubjectIndex;
      if (targetIndex <= 0) {
        setActiveSubjectIndex(targetIndex);
        return;
      }
      let index = 0;
      setActiveSubjectIndex(index);
      const interval = window.setInterval(() => {
        index += 1;
        if (index >= targetIndex) {
          setActiveSubjectIndex(targetIndex);
          window.clearInterval(interval);
        } else {
          setActiveSubjectIndex(index);
        }
      }, 650);
      return () => window.clearInterval(interval);
    }

    if (currentStep.type === 'topic' || currentStep.type === 'chat') {
      setActiveSubjectIndex(currentScene.selectedSubjectIndex);
      return;
    }

    if (currentStep.type === 'loading') {
      setActiveSubjectIndex(-1);
    }
  }, [currentStep, currentScene]);

  useEffect(() => {
    if (currentStep.type !== 'chat') {
      setChatMessagesVisible(0);
      return;
    }

    setChatMessagesVisible(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let revealed = 0;
    const interval = window.setInterval(() => {
      revealed += 1;
      setChatMessagesVisible(prev => {
        const next = Math.min(currentScene.chat.length, prev + 1);
        if (next >= currentScene.chat.length) {
          window.clearInterval(interval);
        }
        return next;
      });
    }, 1100);

    return () => window.clearInterval(interval);
  }, [currentStep, currentScene]);

  const stageName =
    currentStep.type === 'input'
      ? 'inputs'
      : currentStep.type === 'loading'
        ? 'subjects'
        : currentStep.type;

  const inputOrder: FlowField[] = ['language', 'country', 'grade'];
  const activeField = currentStep.type === 'input' ? currentStep.field : null;
  const completedInputIndex =
    currentStep.type === 'input'
      ? inputOrder.indexOf(currentStep.field) - 1
      : inputOrder.length - 1;

  const isLoadingSubjects = currentStep.type === 'loading';
  const showTypingIndicator =
    currentStep.type === 'chat' && chatMessagesVisible < currentScene.chat.length;

  const activeStageIndex = STAGE_ORDER.indexOf(stageName);

  const renderStageContent = (stage: (typeof STAGE_ORDER)[number]) => {
    switch (stage) {
      case 'inputs': {
        return (
          <div className="flex h-full flex-col">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">
              Learner profile
            </div>
            <div className="mt-5 flex-1 space-y-3">
              {inputOrder.map(field => {
                const index = inputOrder.indexOf(field);
                const isActive = activeField === field;
                const isCompleted = index <= completedInputIndex;
                const label =
                  field === 'language'
                    ? 'Language'
                    : field === 'country'
                      ? 'Country'
                      : 'Grade level';
                const value = currentScene.persona[field];

                return (
                  <div
                    key={field}
                    className={classNames(
                      'rounded-2xl border border-white/18 bg-white/8 px-4 py-3 transition-all duration-500 sm:flex sm:items-center sm:justify-between',
                      isActive && 'border-white/45 bg-white/18 shadow shadow-sky-900/20',
                      !isActive && isCompleted && 'border-white/24 bg-white/10',
                      !isActive && !isCompleted && 'opacity-85'
                    )}
                  >
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/65">
                      {label}
                    </div>
                    <div className="mt-2 text-base font-semibold text-white sm:mt-0 sm:text-lg">
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 text-[10px] uppercase tracking-[0.12em] text-white/60">
              Profile set
            </div>
          </div>
        );
      }
      case 'subjects': {
        return (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">
              <span>Subjects</span>
              {isLoadingSubjects ? (
                <span className="flex items-center gap-2 text-[11px] font-medium text-white/70">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Matching...
                </span>
              ) : (
                <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold text-white/80">
                  Personalized
                </span>
              )}
            </div>
            <div className="mt-4 flex-1 space-y-2">
              {currentScene.subjects.map((subject, index) => {
                const isActive = index === activeSubjectIndex;
                return (
                  <div
                    key={subject}
                    className={classNames(
                      'flex items-center justify-between rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm transition-all duration-500',
                      isActive && 'border-white/50 bg-white/25 shadow-sm shadow-sky-900/20'
                    )}
                  >
                    <span className="text-white">{subject}</span>
                    {isActive && (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-50">
                        Selected
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-[10px] uppercase tracking-[0.12em] text-white/60">
              Aligned choices
            </div>
          </div>
        );
      }
      case 'topic': {
        return (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">
              <span>Lesson card</span>
              <span className="rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[10px] font-semibold text-white">
                {currentScene.topic.focus}
              </span>
            </div>
            <div className="mt-4 flex-1 rounded-2xl border border-white/20 bg-white/10 p-4 text-white shadow-inner shadow-sky-900/20">
              <div className="text-lg font-semibold">{currentScene.topic.headline}</div>
              <p className="mt-2 text-sm text-white/80">{currentScene.topic.summary}</p>
              <div className="mt-3 grid gap-2">
                {currentScene.topic.activities.map(activity => (
                  <div
                    key={activity.label}
                    className="rounded-xl border border-white/20 bg-white/10 p-3 text-sm text-white/90"
                  >
                    <div className="font-semibold">{activity.label}</div>
                    <p className="text-white/75">{activity.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-[10px] uppercase tracking-[0.12em] text-white/60">
              Send to learner
            </div>
          </div>
        );
      }
      case 'chat': {
        return (
          <div className="flex h-full flex-col">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">
              Mentor chat
            </div>
            <div className="mt-4 flex-1 space-y-3">
              {currentScene.chat.slice(0, chatMessagesVisible).map((message, index) => (
                <div
                  key={`${message.speaker}-${index}`}
                  className={classNames(
                    'max-w-[18rem] rounded-2xl px-3 py-2 text-sm transition-all duration-500',
                    message.speaker === 'mentor'
                      ? 'ml-0 bg-white/20 text-white shadow-inner shadow-sky-900/25'
                      : 'ml-auto bg-sky-500/90 text-white shadow-sky-900/40'
                  )}
                >
                  {message.text}
                </div>
              ))}
              {showTypingIndicator && (
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span className="h-2 w-2 animate-ping rounded-full bg-white/80" />
                  <span className="h-2 w-2 animate-ping rounded-full bg-white/70 delay-150" />
                  <span className="h-2 w-2 animate-ping rounded-full bg-white/60 delay-300" />
                </div>
              )}
            </div>
            <div className="mt-4 text-[10px] uppercase tracking-[0.12em] text-white/60">
              Mentor check-in
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 text-white">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
        <span className="whitespace-nowrap">
          <StepLabel step={currentStep} />
        </span>
        <span className="whitespace-nowrap text-white/70">
          Step {activeStageIndex + 1} of {STAGE_ORDER.length}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/65">
        {STAGE_ORDER.map((stage, index) => {
          const isActive = index === activeStageIndex;
          return (
            <span
              key={stage}
              className={classNames(
                'rounded-full border border-white/25 px-3 py-1 transition-all duration-300',
                isActive
                  ? 'border-white/60 bg-white/25 text-white shadow shadow-sky-900/25'
                  : 'text-white/55'
              )}
            >
              {STAGE_LABELS[stage]}
            </span>
          );
        })}
      </div>

      <div className="relative h-[320px] overflow-hidden rounded-3xl sm:h-[340px] lg:h-[360px]">
        {STAGE_ORDER.map(stage => {
          const isActive = stage === stageName;
          const stageIndex = STAGE_ORDER.indexOf(stage);
          return (
            <div
              key={stage}
              className={classNames(
                'absolute inset-0 flex flex-col rounded-3xl border border-white/15 bg-gradient-to-br from-white/18 to-white/8 p-6 shadow-xl shadow-sky-900/35 transition-all duration-700 ease-out',
                isActive
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'pointer-events-none opacity-0 translate-y-6 scale-95'
              )}
            >
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80">
                <span className="whitespace-nowrap">{STAGE_LABELS[stage]}</span>
                <span className="whitespace-nowrap text-white/60">
                  Step {stageIndex + 1} of {STAGE_ORDER.length}
                </span>
              </div>
              <div className="mt-4 flex-1">{renderStageContent(stage)}</div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-2">
        {SCENES.map((_, index) => {
          const isActive = index === sceneIndex;
          return (
            <span
              key={index}
              className={classNames(
                'h-1.5 w-6 rounded-full bg-white/30 transition-all duration-500',
                isActive ? 'bg-white/70 opacity-100' : 'opacity-40'
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
