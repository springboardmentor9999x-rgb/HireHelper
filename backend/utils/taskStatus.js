const STATUS_LABELS = {
  0: "OPEN",
  1: "REQUESTED",
  2: "IN_PROGRESS",
  3: "COMPLETED",
  4: "CANCELLED",
  5: "ASSIGNED",
};

function normalizeStatus(status) {
  if (status === null || status === undefined || status === "") {
    return "OPEN";
  }

  if (typeof status === "number") {
    return STATUS_LABELS[status] || `STATUS_${status}`;
  }

  const numericStatus = Number(status);
  if (!Number.isNaN(numericStatus) && String(status).trim() !== "") {
    return STATUS_LABELS[numericStatus] || `STATUS_${numericStatus}`;
  }

  return String(status).trim().toUpperCase();
}

function normalizeTask(task) {
  return {
    ...task,
    status: normalizeStatus(task.status),
  };
}

function mapStatusValueForColumnType(statusType, label) {
  const normalizedLabel = String(label).trim().toUpperCase();
  const statusKey = Object.entries(STATUS_LABELS).find(([, value]) => value === normalizedLabel)?.[0];
  const isNumericStatus = ["integer", "smallint", "bigint"].includes(statusType);

  if (isNumericStatus) {
    return statusKey ? Number(statusKey) : 0;
  }

  return normalizedLabel;
}

module.exports = {
  STATUS_LABELS,
  normalizeStatus,
  normalizeTask,
  mapStatusValueForColumnType,
};
