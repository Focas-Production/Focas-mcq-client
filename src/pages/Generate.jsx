import PageShell from "../components/PageShell"
import MCQWizard from "../components/MCQWizard"

export default function Generate() {
  return (
    <PageShell
      title="Practice MCQs"
      subtitle="Choose a topic and generate AI-powered questions"
    >
      <MCQWizard />
    </PageShell>
  )
}
