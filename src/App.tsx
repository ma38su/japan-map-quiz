import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Map, RotateCcw, Settings2, Trophy, XCircle } from 'lucide-react'
import JapanMap from './JapanMap'
import { LEVELS, PREFECTURES, QUESTION_KINDS, createChoices, shuffle, type Level, type Prefecture, type QuestionKind } from './prefectures'
import { PrefectureName, RubyText } from './RubyText'

type View = 'home' | 'quiz' | 'score'
type ActiveKind = Exclude<QuestionKind, 'mix'>
type Result = 'idle' | 'correct' | 'wrong'
type Score = { correct: number; total: number }
type Progress = { scores: Record<Level, Score>; mistakes: Record<number, number> }

const STORAGE_KEY = 'japan-map-quiz-progress-v1'
const EMPTY_PROGRESS: Progress = { scores: { elementary: { correct: 0, total: 0 }, junior: { correct: 0, total: 0 } }, mistakes: {} }

function loadProgress(): Progress {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Progress | null
    return value?.scores?.elementary && value?.scores?.junior ? value : structuredClone(EMPTY_PROGRESS)
  } catch { return structuredClone(EMPTY_PROGRESS) }
}

function resolveKind(kind: QuestionKind, previous?: ActiveKind): ActiveKind {
  if (kind !== 'mix') return kind
  const kinds: ActiveKind[] = ['map-to-name', 'name-to-map']
  return shuffle(kinds.filter((item) => item !== previous))[0] ?? kinds[0]
}

export default function App() {
  const [view, setView] = useState<View>('home')
  const [level, setLevel] = useState<Level>('elementary')
  const [kind, setKind] = useState<QuestionKind>('mix')
  const [activeKind, setActiveKind] = useState<ActiveKind>('map-to-name')
  const [target, setTarget] = useState<Prefecture | null>(null)
  const [choices, setChoices] = useState<Prefecture[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [result, setResult] = useState<Result>('idle')
  const [round, setRound] = useState({ answered: 0, correct: 0, used: [] as number[] })
  const [complete, setComplete] = useState(false)
  const [progress, setProgress] = useState(loadProgress)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)) }, [progress])
  const total = useMemo(() => Object.values(progress.scores).reduce((sum, score) => ({ correct: sum.correct + score.correct, total: sum.total + score.total }), { correct: 0, total: 0 }), [progress])

  const showQuestion = (prefecture: Prefecture, nextKind: ActiveKind, used: number[], choiceLevel = level) => {
    setTarget(prefecture)
    setActiveKind(nextKind)
    setChoices(createChoices(prefecture, choiceLevel))
    setSelected(null)
    setResult('idle')
    setComplete(false)
    setRound((current) => ({ ...current, used }))
  }

  const start = (nextLevel = level, nextKind = kind) => {
    const first = shuffle(PREFECTURES)[0]
    const resolved = resolveKind(nextKind)
    setLevel(nextLevel)
    setKind(nextKind)
    setRound({ answered: 0, correct: 0, used: [first.code] })
    setView('quiz')
    showQuestion(first, resolved, [first.code], nextLevel)
  }

  const nextQuestion = () => {
    if (round.answered >= 10) {
      setTarget(null); setChoices([]); setComplete(true); return
    }
    const next = shuffle(PREFECTURES.filter((prefecture) => !round.used.includes(prefecture.code)))[0]
    showQuestion(next, resolveKind(kind, activeKind), [...round.used, next.code])
  }

  const answer = (prefecture: Prefecture) => {
    if (!target || result !== 'idle') return
    const correct = prefecture.code === target.code
    setSelected(prefecture.code)
    setResult(correct ? 'correct' : 'wrong')
    setRound((current) => ({ ...current, answered: current.answered + 1, correct: current.correct + Number(correct) }))
    setProgress((current) => ({
      scores: { ...current.scores, [level]: { correct: current.scores[level].correct + Number(correct), total: current.scores[level].total + 1 } },
      mistakes: correct ? current.mistakes : { ...current.mistakes, [target.code]: (current.mistakes[target.code] ?? 0) + 1 },
    }))
  }

  const resetSettings = () => { setTarget(null); setChoices([]); setComplete(false); setView('home') }

  if (view === 'home') return <main className="home">
    <section className="home-map"><JapanMap /></section>
    <section className="home-content">
      <p className="eyebrow">JAPAN MAP QUIZ</p>
      <h1><RubyText text="｜日本地図《にほんちず》クイズ" /></h1>
      <p className="intro"><RubyText text="47｜都道府県《とどうふけん》の｜名前《なまえ》と｜場所《ばしょ》を、｜地図《ちず》を｜見《み》ながら4｜択《たく》で｜覚《おぼ》えよう。" /></p>
      <div className="scope"><Map size={15} /><RubyText text="｜今回《こんかい》の｜範囲《はんい》：｜都道府県名《とどうふけんめい》と｜場所《ばしょ》" /></div>
      <div className="setup-label"><b>1</b><RubyText text="｜学習《がくしゅう》する｜段階《だんかい》を｜選《えら》ぶ" /></div>
      <div className="level-picker">{(Object.keys(LEVELS) as Level[]).map((item) => <button key={item} className={level === item ? 'active' : ''} onClick={() => setLevel(item)}><strong><RubyText text={item === 'elementary' ? '｜小学生向《しょうがくせいむ》け' : '｜中学生向《ちゅうがくせいむ》け'} /></strong><small><RubyText text={LEVELS[item].description.replace('小学校', '｜小学校《しょうがっこう》').replace('都道府県', '｜都道府県《とどうふけん》').replace('中学生', '｜中学生《ちゅうがくせい》').replace('地方', '｜地方《ちほう》').replace('位置', '｜位置《いち》')} /></small></button>)}</div>
      <div className="setup-label"><b>2</b><RubyText text="｜問題《もんだい》のタイプを｜選《えら》んでスタート" /></div>
      <div className="kind-picker">{(Object.keys(QUESTION_KINDS) as QuestionKind[]).map((item) => <button key={item} className={kind === item ? 'active' : ''} onClick={() => { setKind(item); start(level, item) }}><RubyText text={QUESTION_KINDS[item].label.replace('地図', '｜地図《ちず》').replace('都道府県名', '｜都道府県名《とどうふけんめい》')} /><ArrowRight size={15} /></button>)}</div>
      <button className="score-link" onClick={() => setView('score')}><Trophy size={14} /><RubyText text="スコアを｜見《み》る" /></button>
      <p className="capital-note"><RubyText text="※｜県庁所在地《けんちょうしょざいち》は、｜別《べつ》の｜問題《もんだい》として｜追加予定《ついかよてい》です。" /></p>
    </section>
  </main>

  if (view === 'score') return <main className="score-page">
    <button className="back-text" onClick={() => setView('home')}><ArrowLeft size={16} /><RubyText text="トップへ｜戻《もど》る" /></button>
    <p className="eyebrow">YOUR RECORD</p><h1>スコア</h1>
    <div className="score-total"><strong>{total.total ? Math.round(total.correct / total.total * 100) : 0}<small>%</small></strong><span><RubyText text="｜総合正解率《そうごうせいかいりつ》" /></span></div>
    <div className="score-levels">{(Object.keys(LEVELS) as Level[]).map((item) => { const score = progress.scores[item]; return <article key={item}><b>{LEVELS[item].label}</b><strong>{score.correct} / {score.total}</strong><span><RubyText text="｜正解《せいかい》／｜回答《かいとう》" /></span></article> })}</div>
    <button className="primary" onClick={() => setView('home')}><RubyText text="クイズを｜選《えら》ぶ" /><ArrowRight size={17} /></button>
  </main>

  return <main className="quiz">
    <section className="map-panel">
      <button className="map-back" onClick={resetSettings} aria-label="トップへ戻る"><ArrowLeft size={18} /></button>
      <JapanMap target={activeKind === 'map-to-name' ? target ?? undefined : undefined} choices={activeKind === 'name-to-map' ? choices : []} />
    </section>
    <section className="quiz-panel">
      <header className="quiz-context"><span>{kind === 'mix' ? `ミックス・${QUESTION_KINDS[activeKind].label}` : QUESTION_KINDS[activeKind].label}</span><span>{LEVELS[level].label}</span><b><RubyText text="｜問題《もんだい》" /> {Math.min(round.answered + (result === 'idle' ? 1 : 0), 10)} / 10</b><button onClick={resetSettings}><Settings2 size={14} /><RubyText text="｜設定変更《せっていへんこう》" /></button></header>
      {!target && complete ? <div className="result-card">
        <Trophy size={30} /><p><RubyText text="10｜問《もん》のクイズが｜終《お》わりました。" /></p><strong>{round.correct} / {round.answered}<small><RubyText text="｜問正解《もんせいかい》" /></small></strong>
        <div className="result-actions"><button className="primary" onClick={() => start()}><RotateCcw size={16} /><RubyText text="｜同《おな》じ｜設定《せってい》でもう｜一度《いちど》" /></button><button className="secondary" onClick={resetSettings}><Settings2 size={16} /><RubyText text="｜問題《もんだい》を｜選《えら》び｜直《なお》す" /></button></div>
      </div> : target && <div className="question-card">
        <p className="question-number">QUESTION {Math.min(round.answered + (result === 'idle' ? 1 : 0), 10)} / 10</p>
        <h2>{activeKind === 'map-to-name' ? <RubyText text="｜色《いろ》がついた｜都道府県《とどうふけん》はどこ？" /> : <><PrefectureName name={target.name} reading={target.reading} />はどこ？</>}</h2>
        <p className="instruction"><RubyText text={activeKind === 'map-to-name' ? '｜都道府県名《とどうふけんめい》を｜選《えら》んでください。' : '｜地図《ちず》の｜色《いろ》を｜選《えら》んでください。'} /></p>
        <div className="choices">{choices.map((prefecture, index) => { const correct = result !== 'idle' && prefecture.code === target.code; const wrong = result === 'wrong' && prefecture.code === selected; return <button key={prefecture.code} className={correct ? 'correct' : wrong ? 'wrong' : ''} disabled={result !== 'idle'} onClick={() => answer(prefecture)}><span className={`letter color-${index}`}>{String.fromCharCode(65 + index)}</span>{activeKind === 'map-to-name' ? <PrefectureName name={prefecture.name} reading={prefecture.reading} /> : <RubyText text={`${['｜赤《あか》', '｜黄《き》', '｜緑《みどり》', '｜紫《むらさき》'][index]}の｜都道府県《とどうふけん》`} />}</button> })}</div>
        {result !== 'idle' && <div className={`feedback ${result}`}>{result === 'correct' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}<b><RubyText text={result === 'correct' ? '｜正解《せいかい》！' : '｜不正解《ふせいかい》'} /></b><span><RubyText text="｜答《こた》えは" />「<PrefectureName name={target.name} reading={target.reading} />」</span></div>}
        {result !== 'idle' && <button className="primary next" onClick={nextQuestion}><RubyText text={round.answered >= 10 ? '｜結果《けっか》を｜見《み》る' : '｜次《つぎ》の｜問題《もんだい》へ'} /><ArrowRight size={17} /></button>}
      </div>}
    </section>
  </main>
}
