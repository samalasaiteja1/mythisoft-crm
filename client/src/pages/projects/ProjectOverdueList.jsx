import Projects from '../Projects';

export default function ProjectOverdueList() {
  return (
    <Projects
      overdueOnly
      pageTitle="Overdue Projects"
      pageSubtitle="Projects past their end date that are not completed or cancelled"
    />
  );
}
