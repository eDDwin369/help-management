export interface HelpAdminNode {
  id: string;
  name: string;
  kind: "folder" | "subfolder" | "pdf" | "video" | "image" | "text";
  parentId?: string | null;
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

export const DEFAULT_STARTER_NODES: HelpAdminNode[] = [
  {
    id: "folder-test-flow",
    name: "Test Flow",
    kind: "folder",
    owner: "Jordan Admin",
    modified: "May 20, 2026",
    approvalStatus: "approved",
    description: "Standard operational test flow and live site inspection templates.",
    children: [
      {
        id: "doc-test-flow-sop",
        name: "Test Flow SOP & Guidelines",
        kind: "text",
        parentId: "folder-test-flow",
        owner: "Jordan Admin",
        modified: "May 20, 2026",
        approvalStatus: "approved",
        description: "Official procedure for site patrol recordings, motion verification, and digital twin log export.",
        contentUrl: "Standard Operating Procedure (SOP):\n1. Initiate video stream on Level 2 (KL-Ar-L2 Zone).\n2. Verify 360 camera angle calibration and spatial pins.\n3. Record patrol session with timestamp tags.\n4. Export MP4 logs or sync with compliance records.",
      },
      {
        id: "video-test-flow-walkthrough",
        name: "Site Walkthrough Session.mp4",
        kind: "video",
        parentId: "folder-test-flow",
        owner: "Jordan Admin",
        modified: "May 20, 2026",
        size: "18.4 MB",
        approvalStatus: "approved",
        contentUrl: "/help/my-drawings-tour.mp4",
        description: "High-definition recorded patrol walkthrough session with 360 motion tracking.",
      },
      {
        id: "pdf-test-flow-manual",
        name: "Inspection Reference Manual.pdf",
        kind: "pdf",
        parentId: "folder-test-flow",
        owner: "Jordan Admin",
        modified: "May 19, 2026",
        size: "2.1 MB",
        approvalStatus: "approved",
        contentUrl: "/help/site-recordings-table-guide.pdf",
        description: "Complete technical reference manual for inspection logging and zone maintenance.",
      },
      {
        id: "img-test-flow-map",
        name: "Level 2 Spatial Annotation Map.jpg",
        kind: "image",
        parentId: "folder-test-flow",
        owner: "Jordan Admin",
        modified: "May 18, 2026",
        size: "1.4 MB",
        approvalStatus: "approved",
        contentUrl: "/help/pin-location-map.jpg",
        description: "Architectural floor plan showing pinned video sensor positions.",
      },
    ],
  },
  {
    id: "folder-site-recordings",
    name: "Site Recordings & Twin Guide",
    kind: "folder",
    owner: "Jordan Admin",
    modified: "May 15, 2026",
    approvalStatus: "approved",
    description: "Digital twin video playback instructions, motion logs, and zone maps.",
    children: [
      {
        id: "pdf-recordings-guide",
        name: "360 Patrol Capture Guide.pdf",
        kind: "pdf",
        parentId: "folder-site-recordings",
        owner: "Jordan Admin",
        modified: "May 15, 2026",
        size: "3.4 MB",
        approvalStatus: "approved",
        contentUrl: "/help/site-recordings-table-guide.pdf",
        description: "Guide to operating 360 degree cameras in industrial digital twin environments.",
      },
      {
        id: "text-sensor-checklist",
        name: "Sensor Calibration Checklist",
        kind: "text",
        parentId: "folder-site-recordings",
        owner: "Jordan Admin",
        modified: "May 14, 2026",
        approvalStatus: "approved",
        description: "Daily checklist for site operators before initiating scheduled video patrol runs.",
        contentUrl: "Pre-Flight Sensor Checklist:\n• Check lens cleanliness\n• Verify battery level > 80%\n• Confirm Wi-Fi/LTE telemetry link\n• Calibrate gyroscope & GPS coordinates",
      },
    ],
  },
];

export function deduplicateNodes(list: HelpAdminNode[]): HelpAdminNode[] {
  const seenIds = new Set<string>();
  const cleanList: HelpAdminNode[] = [];

  for (const node of list) {
    if (seenIds.has(node.id)) continue;
    seenIds.add(node.id);

    if (node.children && node.children.length > 0) {
      cleanList.push({
        ...node,
        children: deduplicateNodes(node.children),
      });
    } else {
      cleanList.push({
        ...node,
        children: node.children ? [] : undefined,
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
  if (typeof window === "undefined") return DEFAULT_STARTER_NODES;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_NODES_KEY);
    if (!saved) {
      // First time initialization: write default starter nodes including "Test Flow"
      localStorage.setItem(LOCAL_STORAGE_NODES_KEY, JSON.stringify(DEFAULT_STARTER_NODES));
      return DEFAULT_STARTER_NODES;
    }
    const parsed: HelpAdminNode[] = JSON.parse(saved);
    if (!parsed || parsed.length === 0) {
      localStorage.setItem(LOCAL_STORAGE_NODES_KEY, JSON.stringify(DEFAULT_STARTER_NODES));
      return DEFAULT_STARTER_NODES;
    }
    // If "Test Flow" isn't present, make sure it is merged in gracefully
    const hasTestFlow = parsed.some((n) => n.name.toLowerCase() === "test flow");
    let combined = parsed;
    if (!hasTestFlow) {
      combined = [...DEFAULT_STARTER_NODES, ...parsed];
    }
    return deduplicateNodes(combined.map(repairNodeContent));
  } catch (e) {
    console.error("Failed to load saved help admin nodes:", e);
    return DEFAULT_STARTER_NODES;
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

  // Helper to match node with an article from approvedArticles (or all articles)
  const findArticleForNode = (node: HelpAdminNode) => {
    return approvedArticles.find(
      (a) =>
        a.id === node.id ||
        a.id === `art-${node.id}` ||
        a.id === `folder-${node.id}` ||
        normalize(a.title) === normalize(node.name)
    );
  };

  // Set of article IDs that are placed inside folders so they aren't duplicated at the root
  const placedArticleIds = new Set<string>();

  // Recursive converter for nodes
  const convertNode = (node: HelpAdminNode): ApprovedTreeItem | null => {
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
            }
          }
        }
      }

      // Also check if any approvedArticles belong to this folder by cardName or relatedContext
      for (const a of approvedArticles) {
        if (
          !placedArticleIds.has(a.id) &&
          a.id !== node.id &&
          a.id !== `folder-${node.id}` &&
          (normalize(a.hierarchy?.cardName) === normalize(node.name) ||
            normalize(a.relatedContext).includes(normalize(node.name)))
        ) {
          placedArticleIds.add(a.id);
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
      rootTree.push(converted);
    }
  }

  // 2. Check for any approvedArticles that are folders not present in savedNodes
  for (const art of approvedArticles) {
    if (art.contentType === "folder" && !placedArticleIds.has(art.id)) {
      placedArticleIds.add(art.id);

      // Find children belonging to this folder
      const childItems: ApprovedTreeItem[] = [];
      for (const childArt of approvedArticles) {
        if (
          !placedArticleIds.has(childArt.id) &&
          childArt.id !== art.id &&
          (normalize(childArt.hierarchy?.cardName) === normalize(art.title) ||
            normalize(childArt.relatedContext).includes(normalize(art.title)))
        ) {
          placedArticleIds.add(childArt.id);
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

  // 3. Any remaining approved articles are standalone root content
  for (const art of approvedArticles) {
    if (!placedArticleIds.has(art.id) && art.contentType !== "folder") {
      placedArticleIds.add(art.id);
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



