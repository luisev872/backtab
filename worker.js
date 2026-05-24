class TabNode {
  constructor(tabId) {
    this.tabId = tabId;
    this.prev = null;
    this.next = null;
    this.open = true;
  }
}

class TabHistoryList {
  constructor() {
    this.head = null;
    this.size = 0;
    this.map = new Map(); // tabId -> TabNode
  }

  visitTab = (tabId) => {
    const existingNode = this.map.get(tabId);
    if(existingNode !== undefined) {
      this.remove(existingNode);
    }

    const node = new TabNode(tabId);
    this.map.set(tabId, node);
    this.addToFront(node);
  }

  getPreviousTabId = () => {
    const current = this.head?.prev;
    while (current !== null && !current.open) {
      current = current.prev;
    }
    return current?.tabId;
  }

  addToFront = (node) => {
    if (this.head === null) {
      this.head = node;
    } else {
      this.head.next = node;
      node.prev = this.head;
      this.head = node;
    }
    this.size++;
  }

  remove = (node) => {
    if (node === this.head) {
      this.head = this.head.prev;
    } else {
      if (node.prev) node.prev.next = node.next;
      node.next.prev = node.prev;
    }
    this.size--;
  }
}

class TabManager {
  constructor() {
    this.windowLists = new Map(); // windowId -> TabHistoryList
    this.setupListeners();
  }

  setupListeners() {
    chrome.commands.onCommand.addListener((command, tab) => {
      if (command === "backtab") {
        const prevTabId = this.getPreviousTabWithId(tab.windowId)
        if (prevTabId) {
          chrome.tabs.update(prevTabId, { active: true });
        }
      }
    });

    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo.tabId, activeInfo.windowId);
    });

    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      const list = this.windowLists.get(removeInfo.windowId);
      if (list !== undefined) {
        const node = list.map.get(tabId);
        if (node) node.open = false;
      }
    });
  }

  async handleTabActivated(tabId, windowId) {
    if (!this.windowLists.has(windowId)) {
      this.windowLists.set(windowId, new TabHistoryList());
    }

    this.windowLists.get(windowId).visitTab(tabId);
  }

  getPreviousTabWithId(windowId) {
    return this.windowLists.get(windowId)?.getPreviousTabId();
  }
}

const tabManager = new TabManager();
