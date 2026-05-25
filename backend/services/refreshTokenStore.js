const activeRefreshTokenIds = new Map();

function setActiveRefreshTokenId(userId, tokenId) {
  if (!userId || !tokenId) return;
  activeRefreshTokenIds.set(String(userId), String(tokenId));
}

function getActiveRefreshTokenId(userId) {
  if (!userId) return null;
  return activeRefreshTokenIds.get(String(userId)) || null;
}

function revokeRefreshTokens(userId) {
  if (!userId) return;
  activeRefreshTokenIds.delete(String(userId));
}

function resetRefreshTokenStore() {
  activeRefreshTokenIds.clear();
}

module.exports = {
  getActiveRefreshTokenId,
  revokeRefreshTokens,
  resetRefreshTokenStore,
  setActiveRefreshTokenId,
};

