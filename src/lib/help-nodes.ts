export interface HelpAdminNode {
  id: string;
  name: string;
  kind: "folder" | "subfolder" | "pdf" | "video" | "image" | "text";
  parentId?: string | null;
  section?: string;
  sectionKey?: string;
  owner: string;
  size?: string;
  modified: string;
  contentUrl?: string;
  description?: string;
  approvalStatus: "draft" | "pending" | "approved" | "rejected" | "unapproved";
  rejectionReason?: string;
  children?: HelpAdminNode[];
}

export const SAMPLE_MEDIA: Record<string, string> = {
  pdf: "/help/site-recordings-table-guide.pdf",
  image: "/help/pin-location-map.jpg",
  video: "/help/my-drawings-tour.mp4",
  text: "This document contains step-by-step instructions for managing drawings and site plans in HMS.",
};

export const LOCAL_STORAGE_NODES_KEY = "hms_help_admin_nodes_v2";

/**
 * Maps any context key or label to its canonical top-level section key & label.
 */
export function getSectionFromContext(
  key?: string,
  label?: string
): { sectionKey: string; sectionLabel: string } {
  const normKey = (key || "").toLowerCase();
  const normLabel = (label || "").toLowerCase();

  // 1. Site Recordings
  if (
    normKey.includes("site-recordings") ||
    normKey.includes("recordings") ||
    normLabel.includes("site recording")
  ) {
    return { sectionKey: "section-site-recordings", sectionLabel: "Site Recordings" };
  }

  // 2. My Site Patrol
  if (
    normKey.includes("site-patrol") ||
    normKey.includes("patrol") ||
    normLabel.includes("site patrol")
  ) {
    return { sectionKey: "section-site-patrol", sectionLabel: "My Site Patrol" };
  }

  // 3. My Drawings
  if (
    normKey.includes("my-drawings") ||
    (normKey.includes("drawings") && !normKey.includes("video")) ||
    normLabel.includes("my drawing")
  ) {
    return { sectionKey: "section-my-drawings", sectionLabel: "My Drawings" };
  }

  // 4. Drawing - Videos
  if (
    normKey.includes("drawing-videos") ||
    normKey.includes("videos") ||
    (normLabel.includes("drawing") && normLabel.includes("video"))
  ) {
    return { sectionKey: "section-drawing-videos", sectionLabel: "Drawing - Videos" };
  }

  // 5. Tickets
  if (normKey.includes("ticket") || normLabel.includes("ticket")) {
    return { sectionKey: "section-tickets", sectionLabel: "My Tickets" };
  }

  // 6. Admin Coverage
  if (
    normKey.includes("admin-coverage") ||
    normLabel.includes("without help") ||
    normLabel.includes("coverage")
  ) {
    return { sectionKey: "section-admin-coverage", sectionLabel: "Areas Without Help" };
  }

  // 7. Admin Content / Approvals
  if (
    normKey.includes("admin-content") ||
    normLabel.includes("approval") ||
    normLabel.includes("content library")
  ) {
    return { sectionKey: "section-admin-content", sectionLabel: "Approvals" };
  }

  // 8. Admin Overview / Dashboard
  if (normKey.includes("admin") || normLabel.includes("dashboard")) {
    return { sectionKey: "section-admin-overview", sectionLabel: "Dashboard" };
  }

  // 9. Browser pathname fallback
  if (typeof window !== "undefined") {
    const p = window.location.pathname;
    if (p.startsWith("/tickets")) return { sectionKey: "section-tickets", sectionLabel: "My Tickets" };
    if (p.startsWith("/admin")) return { sectionKey: "section-admin-overview", sectionLabel: "Dashboard" };
    if (p.startsWith("/dashboard")) {
      if (typeof document !== "undefined") {
        const activeTabEl = document.querySelector("[data-dashboard-tab]");
        const tabVal = activeTabEl?.getAttribute("data-dashboard-tab");
        if (tabVal === "patrol") return { sectionKey: "section-site-patrol", sectionLabel: "My Site Patrol" };
        if (tabVal === "drawings") return { sectionKey: "section-my-drawings", sectionLabel: "My Drawings" };
        if (tabVal === "videos") return { sectionKey: "section-drawing-videos", sectionLabel: "Drawing - Videos" };
        if (tabVal === "site-recordings") return { sectionKey: "section-site-recordings", sectionLabel: "Site Recordings" };
      }
      return { sectionKey: "section-site-recordings", sectionLabel: "Site Recordings" };
    }
  }

  return { sectionKey: "section-site-recordings", sectionLabel: "Site Recordings" };
}

/**
 * Checks whether a HelpAdminNode belongs to the specified section.
 */
export function matchesNodeSection(
  node: HelpAdminNode,
  currentSectionKey: string,
  currentSectionLabel: string
): boolean {
  const targetKey = currentSectionKey.toLowerCase().trim();
  const targetLabel = currentSectionLabel.toLowerCase().trim();

  const nodeSection = (node.section || "").toLowerCase().trim();
  const nodeKey = (node.sectionKey || "").toLowerCase().trim();

  // If node has explicit section metadata
  if (nodeSection || nodeKey) {
    return (
      nodeSection === targetLabel ||
      nodeKey === targetKey ||
      nodeSection === targetKey ||
      nodeKey === targetLabel
    );
  }

  // Heuristic matching for legacy nodes
  const nodeName = node.name.toLowerCase();
  const nodeId = node.id.toLowerCase();

  if (nodeId.includes("patrol") || nodeName.includes("patrol")) {
    return targetLabel === "my site patrol" || targetKey === "section-site-patrol";
  }
  if (nodeId.includes("site-recordings") || nodeName.includes("site recording")) {
    return targetLabel === "site recordings" || targetKey === "section-site-recordings";
  }
  if (
    nodeId.includes("drawing-video") ||
    nodeName.includes("drawing-video") ||
    (nodeName.includes("drawing") && nodeName.includes("video"))
  ) {
    return targetLabel === "drawing - videos" || targetKey === "section-drawing-videos";
  }
  if (nodeId.includes("drawing") || nodeName.includes("drawing")) {
    return targetLabel === "my drawings" || targetKey === "section-my-drawings";
  }
  if (nodeId.includes("ticket") || nodeName.includes("ticket")) {
    return targetLabel === "my tickets" || targetKey === "section-tickets";
  }

  // Strictly return false if unassigned or no match - do NOT default to Site Recordings
  return false;
}

export function isDummyNode(node: HelpAdminNode): boolean {
  const id = (node.id || "").toLowerCase();
  const name = (node.name || "").toLowerCase().trim();
  return (
    id === "folder-test-flow" ||
    id === "folder-site-recordings" ||
    id === "folder-folder-test-flow" ||
    id === "folder-folder-site-recordings" ||
    id.includes("test-flow") ||
    id.includes("site-recordings-table-guide") ||
    name === "test flow" ||
    name === "site recordings & twin guide" ||
    id === "doc-test-flow-sop" ||
    id === "video-test-flow-walkthrough" ||
    id === "pdf-test-flow-manual" ||
    id === "img-test-flow-map" ||
    id === "pdf-recordings-guide" ||
    id === "text-sensor-checklist"
  );
}

export const DEFAULT_STARTER_NODES: HelpAdminNode[] = [];

const STATUS_PRIORITY: Record<string, number> = {
  approved: 4,
  pending: 3,
  draft: 2,
  rejected: 1,
  unapproved: 1,
};

export function deduplicateNodes(list: HelpAdminNode[]): HelpAdminNode[] {
  const seenIds = new Set<string>();
  const seenFolderKeys = new Map<string, number>(); // folderKey -> index in cleanList
  const cleanList: HelpAdminNode[] = [];

  for (const node of list) {
    if (isDummyNode(node)) continue;
    if (seenIds.has(node.id)) continue;

    const isFolder = node.kind === "folder" || node.kind === "subfolder";

    if (isFolder) {
      const folderKey = `${node.parentId || "root"}::${(node.sectionKey || node.section || "").toLowerCase()}::${node.name.toLowerCase().trim()}`;
      if (seenFolderKeys.has(folderKey)) {
        // Merge into existing folder without creating a duplicate
        const existingIdx = seenFolderKeys.get(folderKey)!;
        const existing = cleanList[existingIdx];
        const existingPriority = STATUS_PRIORITY[existing.approvalStatus] || 0;
        const newPriority = STATUS_PRIORITY[node.approvalStatus] || 0;
        const higherStatus = newPriority > existingPriority ? node.approvalStatus : existing.approvalStatus;

        const mergedChildren = deduplicateNodes([
          ...(existing.children || []),
          ...(node.children || []),
        ]);

        cleanList[existingIdx] = {
          ...existing,
          approvalStatus: higherStatus,
          rejectionReason: higherStatus === "approved" ? undefined : (node.rejectionReason || existing.rejectionReason),
          children: mergedChildren,
        };
        seenIds.add(node.id);
        continue;
      }

      seenIds.add(node.id);
      const cleanedChildren = node.children && node.children.length > 0 ? deduplicateNodes(node.children) : [];
      seenFolderKeys.set(folderKey, cleanList.length);
      cleanList.push({
        ...node,
        children: cleanedChildren,
      });
    } else {
      seenIds.add(node.id);
      cleanList.push({
        ...node,
        children: node.children ? deduplicateNodes(node.children) : undefined,
      });
    }
  }

  return cleanList;
}

export function repairNodeContent(node: HelpAdminNode): HelpAdminNode {
  let contentUrl = node.contentUrl;
  if (node.kind === "image") {
    if (
      !contentUrl ||
      (contentUrl.startsWith("data:") && (contentUrl.length <= 600 || !contentUrl.includes(";base64,")))
    ) {
      contentUrl = SAMPLE_MEDIA.image;
    }
  } else if (node.kind === "video") {
    if (!contentUrl || (contentUrl.startsWith("data:") && contentUrl.length <= 600)) {
      contentUrl = SAMPLE_MEDIA.video;
    }
  } else if (node.kind === "pdf") {
    if (!contentUrl || (contentUrl.startsWith("data:") && contentUrl.length <= 600)) {
      contentUrl = SAMPLE_MEDIA.pdf;
    }
  }
  const updated = { ...node, contentUrl };
  if (updated.children && updated.children.length > 0) {
    updated.children = updated.children.map(repairNodeContent);
  }
  return updated;
}

export function loadSavedNodes(): HelpAdminNode[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_NODES_KEY);
    if (!saved) {
      return [];
    }
    const parsed: HelpAdminNode[] = JSON.parse(saved);
    if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }

    let modified = false;

    // Filter out dummy nodes (like Test Flow and Site Recordings & Twin Guide)
    const removeDummyNodes = (list: HelpAdminNode[]): HelpAdminNode[] => {
      const filtered: HelpAdminNode[] = [];
      for (const item of list) {
        if (isDummyNode(item)) {
          modified = true;
          continue;
        }
        if (item.children && item.children.length > 0) {
          const cleanedChildren = removeDummyNodes(item.children);
          filtered.push({ ...item, children: cleanedChildren });
        } else {
          filtered.push(item);
        }
      }
      return filtered;
    };

    const purged = removeDummyNodes(parsed);

    let persistedArticles: any[] = [];
    try {
      const rawStore = localStorage.getItem("hmsStore.v6") || localStorage.getItem("hmsStore.v5");
      if (rawStore) {
        const parsedStore = JSON.parse(rawStore);
        if (Array.isArray(parsedStore.articles)) {
          persistedArticles = parsedStore.articles;
        }
      }
    } catch {}

    // Auto-migrate any nodes without section or sectionKey or with incorrect fallback
    const migrateNodes = (list: HelpAdminNode[]): HelpAdminNode[] => {
      return list.map((n) => {
        let nodeCopy = { ...n };
        const lowerName = nodeCopy.name.toLowerCase();

        // 1. If name contains "patrol", ensure section is My Site Patrol
        if (lowerName.includes("patrol")) {
          if (nodeCopy.section !== "My Site Patrol" || nodeCopy.sectionKey !== "section-site-patrol") {
            modified = true;
            nodeCopy.section = "My Site Patrol";
            nodeCopy.sectionKey = "section-site-patrol";
          }
        }

        // 2. Cross-reference with persisted articles to recover correct section
        if (persistedArticles.length > 0) {
          const matched = persistedArticles.find(
            (a) =>
              a.id === nodeCopy.id ||
              a.id === `art-${nodeCopy.id}` ||
              a.id === `folder-${nodeCopy.id}` ||
              (a.title && a.title.toLowerCase().trim() === lowerName.trim())
          );
          if (matched) {
            const pageName = matched.hierarchy?.pageName || matched.relatedContext?.split(" › ")[0];
            if (pageName) {
              const sec = getSectionFromContext(matched.contexts?.[0], pageName);
              if (nodeCopy.section !== sec.sectionLabel || nodeCopy.sectionKey !== sec.sectionKey) {
                modified = true;
                nodeCopy.section = sec.sectionLabel;
                nodeCopy.sectionKey = sec.sectionKey;
              }
            }
          }
        }

        // 3. Fallback for nodes still missing section
        if (!nodeCopy.section || !nodeCopy.sectionKey) {
          modified = true;
          const sec = getSectionFromContext(nodeCopy.sectionKey, nodeCopy.section || nodeCopy.name);
          nodeCopy.section = sec.sectionLabel;
          nodeCopy.sectionKey = sec.sectionKey;
        }

        if (nodeCopy.children && nodeCopy.children.length > 0) {
          nodeCopy.children = migrateNodes(nodeCopy.children).map((c) => ({
            ...c,
            section: c.section || nodeCopy.section,
            sectionKey: c.sectionKey || nodeCopy.sectionKey,
          }));
        }
        return nodeCopy;
      });
    };

    const migrated = migrateNodes(purged);
    const cleaned = deduplicateNodes(migrated.map(repairNodeContent));

    if (modified || cleaned.length !== parsed.length) {
      try {
        localStorage.setItem(LOCAL_STORAGE_NODES_KEY, JSON.stringify(cleaned));
      } catch (e) {
        console.warn("Storage quota warning on migration:", e);
      }
    }

    return cleaned;
  } catch (e) {
    console.error("Failed to load saved help admin nodes:", e);
    return [];
  }
}

export function saveSavedNodes(nodes: HelpAdminNode[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_NODES_KEY, JSON.stringify(nodes));
    window.dispatchEvent(new CustomEvent("hms_nodes_updated", { detail: nodes }));
  } catch (e) {
    console.error("Failed to save help admin nodes:", e);
  }
}

export function getAllFolderIds(list: HelpAdminNode[]): string[] {
  let ids: string[] = [];
  for (const node of list) {
    if (node.kind === "folder" || node.kind === "subfolder") {
      ids.push(node.id);
      if (node.children && node.children.length > 0) {
        ids = ids.concat(getAllFolderIds(node.children));
      }
    }
  }
  return ids;
}

export function filterNodes(
  list: HelpAdminNode[],
  query: string,
  onlyApproved = false
): HelpAdminNode[] {
  const q = query.trim().toLowerCase();

  return list
    .map((node) => {
      const isFolder = node.kind === "folder" || node.kind === "subfolder";

      if (isFolder) {
        // Recursively filter children first
        const filteredChildren =
          node.children && node.children.length > 0
            ? filterNodes(node.children, query, onlyApproved)
            : [];

        if (onlyApproved) {
          // Folder customer visibility rules:
          // 1. Rejected folder without any approved contents must never be visible
          const isFolderRejected =
            node.approvalStatus === "rejected" || node.approvalStatus === "unapproved";

          // 2. A folder should be visible to customers as long as it contains at least one approved content
          const hasApprovedContent = filteredChildren.length > 0;

          // 3. Or if the folder itself was approved and has no children (empty approved folder)
          const isFolderApproved = node.approvalStatus === "approved";
          const isEmptyApprovedFolder =
            isFolderApproved && (!node.children || node.children.length === 0);

          if (!hasApprovedContent && !isEmptyApprovedFolder) {
            return null;
          }

          if (isFolderRejected && !hasApprovedContent) {
            return null;
          }

          const matchesSelf =
            !q ||
            node.name.toLowerCase().includes(q) ||
            (node.description && node.description.toLowerCase().includes(q));

          // Visible as long as it contains at least one approved content or matches query
          if (hasApprovedContent || matchesSelf) {
            return {
              ...node,
              children: filteredChildren,
            };
          }

          return null;
        }

        // When not onlyApproved (e.g. Help Admin tree view)
        const matchesSelf =
          !q ||
          node.name.toLowerCase().includes(q) ||
          (node.description && node.description.toLowerCase().includes(q));

        if (matchesSelf || filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren,
          };
        }

        return null;
      }

      // Individual content node (images, videos, PDFs, text):
      if (onlyApproved) {
        // Rejected / pending content must never be visible to customers
        if (node.approvalStatus !== "approved") {
          return null;
        }
      }

      const matchesSelf =
        !q ||
        node.name.toLowerCase().includes(q) ||
        (node.description && node.description.toLowerCase().includes(q));

      if (matchesSelf) {
        return node;
      }

      return null;
    })
    .filter(Boolean) as HelpAdminNode[];
}

export function syncNodeApprovalStatus(
  targetIdOrTitle: string,
  status: "approved" | "rejected" | "pending",
  reason?: string,
  _adminName?: string,
  fallbackTitle?: string
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const list = loadSavedNodes();
    let hasChanges = false;

    const normalize = (s?: string) => s?.trim().toLowerCase() || "";
    const targetKey = normalize(targetIdOrTitle);
    const titleKey = normalize(fallbackTitle);

    const updateRecursive = (nodes: HelpAdminNode[]): HelpAdminNode[] => {
      return nodes.map((node) => {
        const nodeIdKey = normalize(node.id);
        const nodeArtKey = normalize(`art-${node.id}`);
        const nodeFolderKey = normalize(`folder-${node.id}`);
        const nodeNameKey = normalize(node.name);

        const isMatch =
          nodeIdKey === targetKey ||
          nodeArtKey === targetKey ||
          nodeFolderKey === targetKey ||
          nodeNameKey === targetKey ||
          (titleKey && nodeNameKey === titleKey);

        let updated = { ...node };

        if (isMatch) {
          hasChanges = true;
          updated.approvalStatus = status;
          if (status === "rejected" && reason) {
            updated.rejectionReason = reason;
          } else if (status === "approved") {
            updated.rejectionReason = undefined;
          }

          // If a folder itself is approved or rejected:
          if (updated.kind === "folder" || updated.kind === "subfolder") {
            if (updated.children && updated.children.length > 0) {
              if (status === "approved") {
                // Approving a folder approves all pending contents (while respecting any previously rejected)
                updated.children = updated.children.map((child) => {
                  if (child.approvalStatus !== "rejected") {
                    return { ...child, approvalStatus: "approved" };
                  }
                  return child;
                });
              } else if (status === "rejected") {
                // Rejecting a folder marks all its contents as rejected
                updated.children = updated.children.map((child) => ({
                  ...child,
                  approvalStatus: "rejected",
                  rejectionReason: reason || "Folder rejected by Superadmin",
                }));
              }
            }
          }
        }

        // Recursively update children
        if (updated.children && updated.children.length > 0) {
          const updatedChildren = updateRecursive(updated.children);
          if (updatedChildren !== updated.children) {
            updated.children = updatedChildren;
          }
        }

        return updated;
      });
    };

    const nextNodes = updateRecursive(list);
    if (hasChanges) {
      saveSavedNodes(nextNodes);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Failed to sync node approval status:", e);
    return false;
  }
}

export function getFolderContents(folderIdOrTitle: string): HelpAdminNode[] {
  try {
    const list = loadSavedNodes();
    const normalize = (s?: string) => s?.trim().toLowerCase() || "";
    const key = normalize(folderIdOrTitle);

    const findFolder = (nodes: HelpAdminNode[]): HelpAdminNode | null => {
      for (const n of nodes) {
        if (
          normalize(n.id) === key ||
          normalize(`folder-${n.id}`) === key ||
          normalize(n.name) === key
        ) {
          return n;
        }
        if (n.children && n.children.length > 0) {
          const res = findFolder(n.children);
          if (res) return res;
        }
      }
      return null;
    };

    const folder = findFolder(list);
    return folder?.children || [];
  } catch {
    return [];
  }
}

export function deleteNodeById(idOrName: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const list = loadSavedNodes();
    const normalize = (s?: string) => s?.trim().toLowerCase() || "";
    const key = normalize(idOrName);
    let deleted = false;

    const filterRecursive = (nodes: HelpAdminNode[]): HelpAdminNode[] => {
      const res: HelpAdminNode[] = [];
      for (const node of nodes) {
        const isMatch =
          normalize(node.id) === key ||
          normalize(`art-${node.id}`) === key ||
          normalize(`folder-${node.id}`) === key ||
          normalize(node.name) === key;

        if (isMatch) {
          deleted = true;
          continue;
        }

        if (node.children && node.children.length > 0) {
          res.push({
            ...node,
            children: filterRecursive(node.children),
          });
        } else {
          res.push(node);
        }
      }
      return res;
    };

    const nextNodes = filterRecursive(list);
    if (deleted) {
      saveSavedNodes(nextNodes);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Failed to delete node:", e);
    return false;
  }
}

export function toggleHideNode(idOrName: string, hide: boolean): boolean {
  if (typeof window === "undefined") return false;
  try {
    const list = loadSavedNodes();
    const normalize = (s?: string) => s?.trim().toLowerCase() || "";
    const key = normalize(idOrName);
    let modified = false;

    const updateRecursive = (nodes: HelpAdminNode[]): HelpAdminNode[] => {
      return nodes.map((node) => {
        const isMatch =
          normalize(node.id) === key ||
          normalize(`art-${node.id}`) === key ||
          normalize(`folder-${node.id}`) === key ||
          normalize(node.name) === key;

        let updated = { ...node };
        if (isMatch) {
          modified = true;
          updated.approvalStatus = hide ? "draft" : "approved";
          // If folder, also hide/unhide children
          if (updated.children && updated.children.length > 0) {
            updated.children = updated.children.map((child) => ({
              ...child,
              approvalStatus: hide ? "draft" : "approved",
            }));
          }
        }

        if (updated.children && updated.children.length > 0) {
          updated.children = updateRecursive(updated.children);
        }

        return updated;
      });
    };

    const nextNodes = updateRecursive(list);
    if (modified) {
      saveSavedNodes(nextNodes);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Failed to toggle hide node:", e);
    return false;
  }
}

export interface ApprovedTreeItem {
  id: string;
  name: string;
  kind: "folder" | "subfolder" | "pdf" | "video" | "image" | "text";
  articleId: string;
  nodeId?: string;
  archiveStatus: "active" | "archived";
  approvalStatus: "draft" | "pending" | "approved" | "rejected" | "unapproved";
  article?: any;
  node?: HelpAdminNode;
  children: ApprovedTreeItem[];
}

export function buildApprovedTree(
  approvedArticles: any[],
  rawNodes?: HelpAdminNode[]
): ApprovedTreeItem[] {
  const nodes = rawNodes || loadSavedNodes();
  const normalize = (s?: string) => s?.trim().toLowerCase() || "";

  const isDummyTitleOrId = (id?: string, title?: string): boolean => {
    const normId = normalize(id);
    const normTitle = normalize(title);
    return (
      normId.includes("test-flow") ||
      normId.includes("site-recordings-table-guide") ||
      normTitle === "test flow" ||
      normTitle === "site recordings & twin guide" ||
      normId === "folder-test-flow" ||
      normId === "folder-site-recordings" ||
      normId === "folder-folder-test-flow" ||
      normId === "folder-folder-site-recordings"
    );
  };

  // Helper to match node with an article from approvedArticles (or all articles)
  const findArticleForNode = (node: HelpAdminNode) => {
    return approvedArticles.find(
      (a) =>
        a.id === node.id ||
        a.id === `art-${node.id}` ||
        a.id === `folder-${node.id}` ||
        a.id === node.id.replace(/^(folder-|art-)/, "") ||
        normalize(a.title) === normalize(node.name)
    );
  };

  // Set of article IDs that are placed inside folders so they aren't duplicated at the root
  const placedArticleIds = new Set<string>();

  // Recursive converter for nodes
  const convertNode = (node: HelpAdminNode): ApprovedTreeItem | null => {
    if (isDummyNode(node) || isDummyTitleOrId(node.id, node.name)) return null;

    const isFolder = node.kind === "folder" || node.kind === "subfolder";
    const matched = findArticleForNode(node);

    if (isFolder) {
      const childItems: ApprovedTreeItem[] = [];
      if (node.children && node.children.length > 0) {
        for (const childNode of node.children) {
          const convertedChild = convertNode(childNode);
          if (convertedChild) {
            childItems.push(convertedChild);
            if (convertedChild.articleId) {
              placedArticleIds.add(convertedChild.articleId);
              placedArticleIds.add(convertedChild.articleId.replace(/^(art-|folder-)/, ""));
            }
          }
        }
      }

      // Also check if any approvedArticles belong to this folder by cardName or relatedContext
      for (const a of approvedArticles) {
        if (isDummyTitleOrId(a.id, a.title)) continue;
        const normCard = normalize(a.hierarchy?.cardName);
        const normRel = normalize(a.relatedContext);
        const normName = normalize(node.name);

        if (
          !placedArticleIds.has(a.id) &&
          !placedArticleIds.has(a.id.replace(/^(art-|folder-)/, "")) &&
          a.id !== node.id &&
          a.id !== `folder-${node.id}` &&
          (normCard === normName || normRel.includes(normName))
        ) {
          placedArticleIds.add(a.id);
          placedArticleIds.add(a.id.replace(/^(art-|folder-)/, ""));
          childItems.push({
            id: a.id,
            name: a.title,
            kind: (a.contentType === "folder" ? "folder" : a.contentType) as any,
            articleId: a.id,
            archiveStatus: a.archiveStatus || "active",
            approvalStatus: a.approvalStatus,
            article: a,
            children: [],
          });
        }
      }

      const isFolderSelfApproved =
        node.approvalStatus === "approved" || matched?.approvalStatus === "approved";
      const hasApprovedChildren = childItems.length > 0;

      // Folders are visible if approved or containing approved children
      if (!isFolderSelfApproved && !hasApprovedChildren) {
        return null;
      }

      const folderArtId = matched ? matched.id : `folder-${node.id}`;
      placedArticleIds.add(folderArtId);
      placedArticleIds.add(node.id);
      placedArticleIds.add(`folder-${node.id}`);
      placedArticleIds.add(node.id.replace(/^(folder-|art-)/, ""));

      return {
        id: node.id,
        name: node.name,
        kind: node.kind,
        articleId: folderArtId,
        nodeId: node.id,
        archiveStatus: matched?.archiveStatus || "active",
        approvalStatus: (matched?.approvalStatus || node.approvalStatus) as any,
        article: matched,
        node,
        children: childItems,
      };
    } else {
      // Content item
      const isApproved =
        node.approvalStatus === "approved" || matched?.approvalStatus === "approved";
      if (!isApproved) return null;

      const artId = matched ? matched.id : `art-${node.id}`;
      placedArticleIds.add(artId);
      placedArticleIds.add(node.id);
      placedArticleIds.add(node.id.replace(/^(folder-|art-)/, ""));

      return {
        id: node.id,
        name: node.name,
        kind: node.kind,
        articleId: artId,
        nodeId: node.id,
        archiveStatus: matched?.archiveStatus || "active",
        approvalStatus: "approved",
        article: matched,
        node,
        children: [],
      };
    }
  };

  const rootTree: ApprovedTreeItem[] = [];

  // 1. Process root nodes from savedNodes
  for (const rootNode of nodes) {
    const converted = convertNode(rootNode);
    if (converted) {
      // Check if folder with this name already exists in rootTree
      const existingIdx = rootTree.findIndex(
        (rt) =>
          (rt.kind === "folder" || rt.kind === "subfolder") &&
          normalize(rt.name) === normalize(converted.name)
      );
      if (existingIdx >= 0) {
        // Merge children into existing folder instead of duplicating
        const existing = rootTree[existingIdx];
        const existingChildIds = new Set(existing.children.map((c) => c.id));
        for (const child of converted.children) {
          if (!existingChildIds.has(child.id)) {
            existing.children.push(child);
            existingChildIds.add(child.id);
          }
        }
      } else {
        rootTree.push(converted);
      }
    }
  }

  // 2. Check for any approvedArticles that are folders not present in savedNodes
  for (const art of approvedArticles) {
    if (isDummyTitleOrId(art.id, art.title)) continue;
    if (
      art.contentType === "folder" &&
      !placedArticleIds.has(art.id) &&
      !placedArticleIds.has(art.id.replace(/^(art-|folder-)/, ""))
    ) {
      placedArticleIds.add(art.id);
      placedArticleIds.add(art.id.replace(/^(art-|folder-)/, ""));

      // Check if a folder with the same name already exists in rootTree
      const existingInTree = rootTree.find(
        (rt) =>
          (rt.kind === "folder" || rt.kind === "subfolder") &&
          normalize(rt.name) === normalize(art.title)
      );

      // Find children belonging to this folder
      const childItems: ApprovedTreeItem[] = [];
      for (const childArt of approvedArticles) {
        if (isDummyTitleOrId(childArt.id, childArt.title)) continue;
        if (
          !placedArticleIds.has(childArt.id) &&
          !placedArticleIds.has(childArt.id.replace(/^(art-|folder-)/, "")) &&
          childArt.id !== art.id &&
          (normalize(childArt.hierarchy?.cardName) === normalize(art.title) ||
            normalize(childArt.relatedContext).includes(normalize(art.title)))
        ) {
          placedArticleIds.add(childArt.id);
          placedArticleIds.add(childArt.id.replace(/^(art-|folder-)/, ""));
          childItems.push({
            id: childArt.id,
            name: childArt.title,
            kind: childArt.contentType as any,
            articleId: childArt.id,
            archiveStatus: childArt.archiveStatus || "active",
            approvalStatus: childArt.approvalStatus,
            article: childArt,
            children: [],
          });
        }
      }

      if (existingInTree) {
        // Merge into existing folder
        const existingChildIds = new Set(existingInTree.children.map((c) => c.id));
        for (const child of childItems) {
          if (!existingChildIds.has(child.id)) {
            existingInTree.children.push(child);
            existingChildIds.add(child.id);
          }
        }
      } else {
        rootTree.push({
          id: art.id,
          name: art.title,
          kind: "folder",
          articleId: art.id,
          archiveStatus: art.archiveStatus || "active",
          approvalStatus: art.approvalStatus,
          article: art,
          children: childItems,
        });
      }
    }
  }

  // 3. Any remaining approved articles are standalone root content
  for (const art of approvedArticles) {
    if (isDummyTitleOrId(art.id, art.title)) continue;
    if (
      !placedArticleIds.has(art.id) &&
      !placedArticleIds.has(art.id.replace(/^(art-|folder-)/, "")) &&
      art.contentType !== "folder"
    ) {
      placedArticleIds.add(art.id);
      placedArticleIds.add(art.id.replace(/^(art-|folder-)/, ""));
      rootTree.push({
        id: art.id,
        name: art.title,
        kind: art.contentType as any,
        articleId: art.id,
        archiveStatus: art.archiveStatus || "active",
        approvalStatus: art.approvalStatus,
        article: art,
        children: [],
      });
    }
  }

  return rootTree;
}

/**
 * Calculates a non-overlapping position for the white panel (HMS Panel / Help Admin Modal)
 * so that it appears adjacent to the dark/black Site Recordings modal (Visual Help Popover)
 * with a 12-16px gap without overlapping it.
 *
 * Checks:
 * 1. Right side of the black modal (preferred)
 * 2. Left side of the black modal (if right side overflows viewport)
 * 3. Below the black modal (if horizontal space is insufficient)
 * 4. Above the black modal
 * 5. Viewport clamping and fallback
 */
export function calculateNonOverlappingPosition(
  clientX: number,
  clientY: number,
  panelWidth: number,
  panelHeight: number,
  gap: number = 14
): { x: number; y: number } {
  if (typeof window === "undefined") {
    return { x: clientX, y: clientY };
  }

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const margin = 12;

  // Find the dark/black Site Recordings modal in the DOM if open
  const blackModal = document.querySelector<HTMLElement>(
    '[data-visual-popover="true"], .visual-help-popover'
  );

  if (blackModal) {
    const rect = blackModal.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      // 1. Preferred: Right side of the black modal with gap
      const rightX = rect.right + gap;
      if (rightX + panelWidth <= viewportW - margin) {
        // Aligns vertically with the top of the black modal, clamped within viewport
        const y = Math.max(margin, Math.min(rect.top, viewportH - panelHeight - margin));
        return { x: Math.round(rightX), y: Math.round(y) };
      }

      // 2. Left side of the black modal with gap
      const leftX = rect.left - gap - panelWidth;
      if (leftX >= margin) {
        const y = Math.max(margin, Math.min(rect.top, viewportH - panelHeight - margin));
        return { x: Math.round(leftX), y: Math.round(y) };
      }

      // 3. Below the black modal with gap
      const bottomY = rect.bottom + gap;
      if (bottomY + panelHeight <= viewportH - margin) {
        const x = Math.max(margin, Math.min(rect.left, viewportW - panelWidth - margin));
        return { x: Math.round(x), y: Math.round(bottomY) };
      }

      // 4. Above the black modal with gap
      const topY = rect.top - gap - panelHeight;
      if (topY >= margin) {
        const x = Math.max(margin, Math.min(rect.left, viewportW - panelWidth - margin));
        return { x: Math.round(x), y: Math.round(topY) };
      }

      // 5. Fallback for constrained viewports: pick whichever side has more room
      const roomRight = viewportW - rect.right;
      const roomLeft = rect.left;
      const x =
        roomRight >= roomLeft
          ? Math.min(rect.right + gap, viewportW - panelWidth - margin)
          : Math.max(margin, rect.left - gap - panelWidth);
      const y = Math.max(margin, Math.min(rect.top, viewportH - panelHeight - margin));
      return { x: Math.round(x), y: Math.round(y) };
    }
  }

  // Standard right-click viewport clamping when black modal is not open
  const defaultX = Math.max(margin, Math.min(clientX, viewportW - panelWidth - 16));
  const defaultY = Math.max(margin, Math.min(clientY, viewportH - panelHeight - 16));
  return { x: Math.round(defaultX), y: Math.round(defaultY) };
}



