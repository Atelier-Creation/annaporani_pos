export const RECEIPT_SETTINGS_KEY = "duchReceiptSettings";

export const defaultReceiptSettings = {
  storeName: "ANNAPOORANI",
  instagram: "annapoorani_sweets",
  cell1: "7010668139",
  cell2: "89764718464",
  gstin: "33AYDPV1722F1ZO",
  billTitle: "CUSTOMER COPY",
  footerTitle: "Terms & Conditions:",
  footerTerms: [
    "Goods once sold cannot be taken back.",
    "Opened packet  No Exchange.",
    "No Cash Refund.",
    "Subject to Coimbatore Jurisdiction.",
  ].join("\n"),
};

export const getReceiptSettings = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(RECEIPT_SETTINGS_KEY) || "{}");
    return { ...defaultReceiptSettings, ...saved };
  } catch {
    return defaultReceiptSettings;
  }
};

export const saveReceiptSettings = (settings) => {
  const next = { ...defaultReceiptSettings, ...settings };
  localStorage.setItem(RECEIPT_SETTINGS_KEY, JSON.stringify(next));
  return next;
};

export const getBranchDetails = (branches = [], selectedBranch) => {
  if (!selectedBranch || selectedBranch.id === "all") return null;
  const userBranch = branches.find((item) => item.branch_id === selectedBranch.id);
  return userBranch?.branch || null;
};

export const getBranchAddressLines = (branch) => {
  if (!branch) return ["Coimbatore, Tamil Nadu"];

  const lines = [];
  if (branch.address) {
    lines.push(...String(branch.address).split(/\r?\n/).filter(Boolean));
  }

  const cityLine = [branch.city, branch.state].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);
  if (branch.phone) lines.push(`CELL: ${branch.phone}`);

  return lines.length > 0 ? lines : [branch.branch_name || "ANNAPOORANI"];
};

export const getReceiptProfile = ({ branches = [], selectedBranch, settings, branch: branchOverride } = {}) => {
  const branch = branchOverride || getBranchDetails(branches, selectedBranch);
  const receiptSettings = settings || getReceiptSettings();

  return {
    ...receiptSettings,
    branch,
    addressLines: getBranchAddressLines(branch),
  };
};
