const { hasDatabase, query } = require('../config/db');

function normalizeRequest(item) {
  if (!item) return null;

  const sparkCost =
    item.sparkCost ??
    item.spark_cost ??
    item.sparks ??
    item.sparkAmount ??
    item.spark_amount ??
    0;

  return {
    id: item.id ?? null,
    name: item.name ?? '',
    description: item.description ?? item.desc ?? null,
    sparkCost: Number(sparkCost) || 0,
  };
}

async function listPerformerRequests(performer) {
  if (!performer?.id) return [];

  if (!hasDatabase()) {
    return (performer.requests || []).map(normalizeRequest).filter(Boolean);
  }

  const { rows } = await query(
    `SELECT id, name, description, spark_cost
     FROM performer_requests
     WHERE performer_id = $1 AND is_active = TRUE
     ORDER BY sort_order ASC, created_at DESC`,
    [performer.id]
  );

  return rows.map((row) =>
    normalizeRequest({
      id: row.id,
      name: row.name,
      description: row.description,
      spark_cost: row.spark_cost,
    })
  );
}

module.exports = {
  listPerformerRequests,
};

