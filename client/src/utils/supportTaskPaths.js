/** List + detail routes for support handoff tasks (SE vs TSE) */

export function supportTaskListPath(taskOrCategory) {
  const category = typeof taskOrCategory === 'string' && !taskOrCategory.includes('_')
    ? (taskOrCategory === 'technical' ? 'technical_support_engineer' : 'support_executive')
    : (taskOrCategory?.assigneeCategory || taskOrCategory);
  if (category === 'technical_support_engineer') return '/technical/support-tasks';
  return '/support/my-tasks';
}

export function supportTaskDetailPath(projectId, taskId, taskOrCategory) {
  return `${supportTaskListPath(taskOrCategory)}/${projectId}/${taskId}`;
}
