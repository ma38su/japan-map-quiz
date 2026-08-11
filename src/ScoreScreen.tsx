import { ArrowLeft, ArrowRight } from 'lucide-react'
import { LEVELS, type Level } from './prefectures'
import { RubyText } from './RubyText'
import type { QuizController } from './useQuiz'

export function ScoreScreen({ quiz }: { quiz: QuizController }) {
  return <main className="score-page">
    <button className="back-text" onClick={() => quiz.setView('home')}><ArrowLeft size={16} /><RubyText text="トップへ｜戻《もど》る" /></button>
    <p className="eyebrow">YOUR RECORD</p><h1>スコア</h1>
    <div className="score-total"><strong>{quiz.total.total ? Math.round(quiz.total.correct / quiz.total.total * 100) : 0}<small>%</small></strong><span><RubyText text="｜総合正解率《そうごうせいかいりつ》" /></span></div>
    <div className="score-levels">{(Object.keys(LEVELS) as Level[]).map((item) => { const score = quiz.progress.scores[item]; return <article key={item}><b><RubyText text={LEVELS[item].labelRuby} /></b><strong>{score.correct} / {score.total}</strong><span><RubyText text="｜正解《せいかい》／｜回答《かいとう》" /></span></article> })}</div>
    <button className="primary" onClick={() => quiz.setView('home')}><RubyText text="クイズを｜選《えら》ぶ" /><ArrowRight size={17} /></button>
  </main>
}
