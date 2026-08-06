import Document from '../models/Document.js';

/** Copy deal requirement files onto a project (admin/manager uploads from lead/deal flow). */
export const copyDealRequirementsToProject = async (dealId, projectId) => {
  const dealDocs = await Document.find({
    'relatedTo.type': 'deal',
    'relatedTo.id': dealId,
    isActive: true,
    $or: [
      { folder: 'Project Requirements' },
      { folder: 'Requirements' },
      { tags: 'requirements' },
    ],
  }).lean();

  if (!dealDocs.length) return;

  const existingDocs = await Document.find({
    'relatedTo.type': 'project',
    'relatedTo.id': projectId,
    fileUrl: { $in: dealDocs.map((doc) => doc.fileUrl) },
  }).select('fileUrl').lean();
  const existingUrls = new Set(existingDocs.map((d) => d.fileUrl));

  const createDocs = dealDocs
    .filter((doc) => !existingUrls.has(doc.fileUrl))
    .map((doc) => {
      const isCustomerSubmission = Array.isArray(doc.tags) && doc.tags.includes('customer-submission');
      return {
        name: doc.name,
        folder: isCustomerSubmission ? 'CustomerRequirements' : 'Requirements',
        fileUrl: doc.fileUrl,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        relatedTo: { type: 'project', id: projectId },
        tags: isCustomerSubmission
          ? ['requirements', 'customer-submission']
          : ['requirements'],
        notes: doc.notes,
        uploadedBy: doc.uploadedBy,
        isActive: doc.isActive,
      };
    });

  if (createDocs.length) {
    await Document.insertMany(createDocs);
  }
};
