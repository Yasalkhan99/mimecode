// Helper functions for MongoDB document conversion

export function convertToAPIFormat(doc: any) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    id: obj._id?.toString() || obj.id,
    _id: undefined,
    // Convert Date to milliseconds for compatibility with Firestore Timestamp format
    createdAt: obj.createdAt ? (obj.createdAt instanceof Date ? obj.createdAt.getTime() : obj.createdAt) : undefined,
    updatedAt: obj.updatedAt ? (obj.updatedAt instanceof Date ? obj.updatedAt.getTime() : obj.updatedAt) : undefined,
    // Convert expiryDate if it exists
    expiryDate: obj.expiryDate ? (obj.expiryDate instanceof Date ? obj.expiryDate.getTime() : obj.expiryDate) : null,
  };
}

export function convertArrayToAPIFormat(docs: any[]) {
  return docs.map(convertToAPIFormat);
}

