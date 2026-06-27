export const RECEIPT_SETTINGS_KEY = "duchReceiptSettings";

export const defaultReceiptSettings = {
  storeName: "DUCH CLOTHING",
  instagram: "duch clothing_",
  cell1: "7010968189",
  cell2: "8973418464",
  gstin: "33AYDPV1722F1ZO",
  billTitle: "CASH BILL",
  footerTitle: "Terms & Conditions:",
  footerTerms: [
    "Goods once sold cannot be taken back.",
    "Altered/Washed/Used Garments No Exchange.",
    "Any Exchange 7days only.",
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
  if (!branch) return ["No.27a, Thiruvasagam street,", "Near Prozone Mall, Coimbatore-641035."];

  const lines = [];
  if (branch.address) {
    lines.push(...String(branch.address).split(/\r?\n/).filter(Boolean));
  }

  const cityLine = [branch.city, branch.state].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);
  if (branch.phone) lines.push(`CELL: ${branch.phone}`);

  return lines.length > 0 ? lines : [branch.branch_name || "DUCH CLOTHING"];
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
