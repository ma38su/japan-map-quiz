export function RubyText({ text }: { text: string }) {
  return <span className="ruby-text">{text.split(/(｜[^《]+《[^》]+》)/g).filter(Boolean).map((part, index) => {
    const match = part.match(/^｜([^《]+)《([^》]+)》$/)
    return match ? <ruby key={index}>{match[1]}<rt>{match[2]}</rt></ruby> : <span key={index}>{part}</span>
  })}</span>
}

export function PrefectureName({ name, reading }: { name: string; reading: string }) {
  return <ruby>{name}<rt>{reading}</rt></ruby>
}
