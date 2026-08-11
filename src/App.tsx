import { HomeScreen } from './HomeScreen'
import { QuizScreen } from './QuizScreen'
import { ScoreScreen } from './ScoreScreen'
import { useQuiz } from './useQuiz'

export default function App() {
  const quiz = useQuiz()
  if (quiz.view === 'home') return <HomeScreen quiz={quiz} />
  if (quiz.view === 'score') return <ScoreScreen quiz={quiz} />
  return <QuizScreen quiz={quiz} />
}
