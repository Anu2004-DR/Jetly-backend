const memoryStore = new Map();

function saveMessage(userId, role, content) {
  if (!memoryStore.has(userId)) {
    memoryStore.set(userId, []);
  }

  memoryStore.get(userId).push({
    role,
    content,
  });
}

function getConversation(userId) {
  return memoryStore.get(userId) || [];
}

function clearConversation(userId) {
  memoryStore.delete(userId);
}

module.exports = {
  saveMessage,
  getConversation,
  clearConversation,
};