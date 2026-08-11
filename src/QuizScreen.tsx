import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Settings2, Trophy, XCircle } from 'lucide-react'
import JapanMap from './JapanMap'
import { LEVELS, QUESTION_KINDS } from './prefectures'
import { PrefectureName, RubyText } from './RubyText'
import type { QuizController } from './useQuiz'

export function QuizScreen({ quiz }: { quiz: QuizController }) {
  const questionNumber = Math.min(quiz.round.answered + (quiz.result === 'idle' ? 1 : 0), 10)
  return <main className="quiz">
    <section className="map-panel">
      <button className="map-back" onClick={quiz.resetSettings} aria-label="トップへ戻る"><ArrowLeft size={18} /></button>
      <JapanMap target={quiz.activeKind === 'map-to-name' ? quiz.target ?? undefined : undefined} choices={quiz.activeKind === 'name-to-map' ? quiz.choices : []} />
    </section>
    <section className="quiz-panel">
      <header className="quiz-context"><span>{quiz.kind === 'mix' ? `ミックス・${QUESTION_KINDS[quiz.activeKind].label}` : QUESTION_KINDS[quiz.activeKind].label}</span><span>{LEVELS[quiz.level].label}</span><b><RubyText text="｜問題《もんだい》" /> {questionNumber} / 10</b><button onClick={quiz.resetSettings}><Settings2 size={14} /><RubyText text="｜設定変更《せっていへんこう》" /></button></header>
      {!quiz.target && quiz.complete ? <div className="result-card">
        <Trophy size={30} /><p><RubyText text="10｜問《もん》のクイズが｜終《お》わりました。" /></p><strong>{quiz.round.correct} / {quiz.round.answered}<small><RubyText text="｜問正解《もんせいかい》" /></small></strong>
        <div className="result-actions"><button className="primary" onClick={() => quiz.start()}><RotateCcw size={16} /><RubyText text="｜同《おな》じ｜設定《せってい》でもう｜一度《いちど》" /></button><button className="secondary" onClick={quiz.resetSettings}><Settings2 size={16} /><RubyText text="｜問題《もんだい》を｜選《えら》び｜直《なお》す" /></button></div>
      </div> : quiz.target && <div className="question-card">
        <p className="question-number">QUESTION {questionNumber} / 10</p>
        <h2>{quiz.activeKind === 'map-to-name' ? <RubyText text="｜色《いろ》がついた｜都道府県《とどうふけん》はどこ？" /> : <><PrefectureName name={quiz.target.name} reading={quiz.target.reading} />はどこ？</>}</h2>
        <p className="instruction"><RubyText text={quiz.activeKind === 'map-to-name' ? '｜都道府県名《とどうふけんめい》を｜選《えら》んでください。' : '｜地図《ちず》の｜色《いろ》を｜選《えら》んでください。'} /></p>
        <div className="choices">{quiz.choices.map((prefecture, index) => { const correct = quiz.result !== 'idle' && prefecture.code === quiz.target?.code; const wrong = quiz.result === 'wrong' && prefecture.code === quiz.selected; return <button key={prefecture.code} className={correct ? 'correct' : wrong ? 'wrong' : ''} disabled={quiz.result !== 'idle'} onClick={() => quiz.answer(prefecture)}><span className={`letter color-${index}`}>{String.fromCharCode(65 + index)}</span>{quiz.activeKind === 'map-to-name' ? <PrefectureName name={prefecture.name} reading={prefecture.reading} /> : <RubyText text={`${['｜赤《あか》', '｜黄《き》', '｜緑《みどり》', '｜紫《むらさき》'][index]}の｜都道府県《とどうふけん》`} />}</button> })}</div>
        {quiz.result !== 'idle' && <div className={`feedback ${quiz.result}`}>{quiz.result === 'correct' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}<b><RubyText text={quiz.result === 'correct' ? '｜正解《せいかい》！' : '｜不正解《ふせいかい》'} /></b><span><RubyText text="｜答《こた》えは" />「<PrefectureName name={quiz.target.name} reading={quiz.target.reading} />」</span></div>}
        {quiz.result !== 'idle' && <button className="primary next" onClick={quiz.nextQuestion}><RubyText text={quiz.round.answered >= 10 ? '｜結果《けっか》を｜見《み》る' : '｜次《つぎ》の｜問題《もんだい》へ'} /><ArrowRight size={17} /></button>}
      </div>}
    </section>
  </main>
}
