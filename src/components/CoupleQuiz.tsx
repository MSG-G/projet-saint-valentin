import { useState } from 'react';
import { HelpCircle, Heart, RotateCcw, Trophy } from 'lucide-react';
import { getQuizQuestions, getQuizBestScore, saveQuizBestScore, type QuizQuestion } from '@/utils/storage';

const DEFAULT_QUESTIONS: QuizQuestion[] = [
  { id: '1', question: "Quelle est la date de notre rencontre ?", options: ["14 février 2024", "1er mars 2024", "25 décembre 2023", "10 janvier 2024"], answer: 0 },
  { id: '2', question: "Quel est mon plat préféré ?", options: ["Pizza", "Sushi", "Pasta", "Tacos"], answer: 2 },
  { id: '3', question: "Quelle est notre chanson ?", options: ["Perfect - Ed Sheeran", "All of Me - John Legend", "Thinking Out Loud", "A Thousand Years"], answer: 1 },
  { id: '4', question: "Où est-ce que je rêve de voyager ?", options: ["Japon", "Maldives", "Italie", "Grèce"], answer: 2 },
  { id: '5', question: "Quelle est ma couleur préférée ?", options: ["Bleu", "Rose", "Vert", "Violet"], answer: 1 },
  { id: '6', question: "Quel est mon film romantique préféré ?", options: ["Titanic", "The Notebook", "La La Land", "À tous les garçons..."], answer: 2 },
  { id: '7', question: "Qu'est-ce que j'aime le plus chez toi ?", options: ["Ton sourire", "Tes yeux", "Ton humour", "Tout ! 💕"], answer: 3 },
];

const CoupleQuiz = () => {
  const [questions] = useState<QuizQuestion[]>(() => getQuizQuestions(DEFAULT_QUESTIONS));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [bestScore, setBestScore] = useState(() => getQuizBestScore(0));

  const q = questions[current];

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === q.answer;
    if (correct) setScore((s) => s + 1);

    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent((c) => c + 1);
        setSelected(null);
      } else {
        const finalScore = correct ? score + 1 : score;
        if (finalScore > bestScore) {
          setBestScore(finalScore);
          saveQuizBestScore(finalScore);
        }
        setFinished(true);
      }
    }, 1200);
  };

  const restart = () => {
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const msg = pct === 100 ? "Tu me connais par cœur ! 💕" :
                pct >= 70 ? "Presque parfait, mon amour ! 🥰" :
                pct >= 50 ? "Pas mal, mais tu peux mieux faire ! 😘" :
                "On a encore beaucoup à apprendre ! 💝";

    return (
      <section className="py-8 px-4 max-w-2xl mx-auto">
        <div className="glass-card p-8 text-center animate-fade-in">
          <Trophy className="mx-auto mb-4 text-romantic-gold" size={48} />
          <h2 className="font-display text-3xl text-foreground mb-2">Résultat</h2>
          <p className="text-6xl font-display text-primary mb-2">{score}/{questions.length}</p>
          <p className="text-muted-foreground font-body mb-1">{msg}</p>
          <p className="text-sm text-muted-foreground mb-6">Meilleur score : {bestScore}/{questions.length} ⭐</p>

          <div className="flex justify-center gap-3 mb-6">
            {Array.from({ length: 5 }, (_, i) => (
              <Heart
                key={i}
                size={28}
                fill={i < Math.ceil((pct / 100) * 5) ? 'currentColor' : 'none'}
                className={`text-primary transition-all duration-300 ${i < Math.ceil((pct / 100) * 5) ? 'animate-pulse-heart' : ''}`}
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>

          <button
            onClick={restart}
            className="flex items-center gap-2 mx-auto romantic-gradient text-primary-foreground px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-all duration-200 shadow-md"
          >
            <RotateCcw size={18} /> Rejouer
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-4 max-w-2xl mx-auto">
      <div className="text-center mb-6 animate-fade-in">
        <HelpCircle className="mx-auto mb-2 text-primary" size={32} />
        <h2 className="font-display text-3xl text-foreground mb-2">Quiz de Couple</h2>
        <p className="text-muted-foreground font-body">Tu me connais vraiment ? 💕</p>
      </div>

      {/* Progress */}
      <div className="glass-card p-3 mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2 font-body">
          <span>Question {current + 1}/{questions.length}</span>
          <span>Score: {score} ⭐</span>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full romantic-gradient rounded-full transition-all duration-500"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="glass-card p-6 mb-6 animate-fade-in" key={q.id}>
        <p className="font-display text-xl text-foreground text-center mb-6">{q.question}</p>
        <div className="grid grid-cols-1 gap-3">
          {q.options.map((opt, idx) => {
            let style = 'bg-secondary/50 hover:bg-secondary text-foreground';
            if (selected !== null) {
              if (idx === q.answer) style = 'romantic-gradient text-primary-foreground scale-[1.02] shadow-lg';
              else if (idx === selected) style = 'bg-destructive/20 text-destructive';
              else style = 'bg-secondary/30 text-muted-foreground';
            }
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={selected !== null}
                className={`p-4 rounded-xl font-body transition-all duration-300 text-left ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CoupleQuiz;
