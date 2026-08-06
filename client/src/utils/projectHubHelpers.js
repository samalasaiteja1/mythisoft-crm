/** Group document records by project id */
export function groupDocsByProject(documents = []) {
  return documents.reduce((acc, doc) => {
    const pid = String(doc.relatedTo?.id || doc.projectId || '');
    if (!pid) return acc;
    if (!acc[pid]) {
      acc[pid] = { projectName: doc.projectName || 'Project', docs: [] };
    }
    acc[pid].docs.push(doc);
    return acc;
  }, {});
}

export function projectFilterOptions(projects = [], countMap = {}) {
  return projects.map((p) => ({
    id: String(p._id),
    name: p.name,
    count: countMap[String(p._id)] || 0,
  }));
}
