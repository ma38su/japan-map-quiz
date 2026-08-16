import { ArrowRight, Map, Trophy } from 'lucide-react'
import JapanMap from './JapanMap'
import { LEVELS, QUESTION_KINDS, type Level, type QuestionKind } from './prefectures'
import { RubyText } from './RubyText'
import type { QuizController } from './useQuiz'

export function HomeScreen({ quiz }: { quiz: QuizController }) {
  return <main className="home">
    <section className="home-map"><JapanMap /></section>
    <section className="home-content">
      <p className="eyebrow">JAPAN MAP QUIZ</p>
      <h1><RubyText text="｜日本地図《にほんちず》クイズ" /></h1>
      <p className="intro"><RubyText text="47｜都道府県《とどうふけん》の｜名前《なまえ》・｜場所《ばしょ》・｜県庁所在地《けんちょうしょざいち》を、｜地図《ちず》を｜見《み》ながら4｜択《たく》で｜覚《おぼ》えよう。" /></p>
      <div className="scope"><Map size={15} /><RubyText text="｜今回《こんかい》の｜範囲《はんい》：｜都道府県《とどうふけん》と｜県庁所在地《けんちょうしょざいち》" /></div>
      <div className="setup-label"><b>1</b><RubyText text="｜学習《がくしゅう》する｜段階《だんかい》を｜選《えら》ぶ" /></div>
      <div className="level-picker">{(Object.keys(LEVELS) as Level[]).map((item) => <button key={item} className={quiz.level === item ? 'active' : ''} onClick={() => quiz.setLevel(item)}><strong><RubyText text={LEVELS[item].labelRuby} /></strong><small><RubyText text={LEVELS[item].descriptionRuby} /></small></button>)}</div>
      <div className="setup-label"><b>2</b><RubyText text="｜問題《もんだい》のタイプを｜選《えら》んでスタート" /></div>
      <div className="kind-picker">{(Object.keys(QUESTION_KINDS) as QuestionKind[]).map((item) => <button key={item} className={quiz.kind === item ? 'active' : ''} onClick={() => { quiz.setKind(item); quiz.start(quiz.level, item) }}><RubyText text={QUESTION_KINDS[item].labelRuby} /><ArrowRight size={15} /></button>)}</div>
      <button className="score-link" onClick={() => quiz.setView('score')}><Trophy size={14} /><RubyText text="スコアを｜見《み》る" /></button>
      <p className="capital-note"><RubyText text="※｜県庁所在地《けんちょうしょざいち》クイズには、｜実在《じつざい》しない｜地名《ちめい》も｜選択肢《せんたくし》に｜登場《とうじょう》します。" /></p>
    </section>
  </main>
}
