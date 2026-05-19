class TabNode {
  constructor(tabId) {
    this.tabId = tabId;
    this.prev = null;
    this.next = null;
  }
}

class TabHistoryList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  addToFront(tabId) {
    const node = new TabNode(tabId);

    if (this.head === null) {
      this.head = this.tail = node;
    } else {
      node.prev = this.head;
      this.head.next = node;
      this.head = node;
    }
    this.size++;
  }
}

class TabManager {
  constructor() {
    this.windowLists = new Map(); // windowId -> TabHistoryList
    this.setupListeners();
  }

  setupListeners() {
    chrome.commands.onCommand.addListener((command) => {
      if (command === "backtab") {
        this.getPreviousTab().then((prevTabId) => {
          if (prevTabId) {
            chrome.tabs.update(prevTabId, { active: true });
          }
        });
      }
    });

    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo.tabId, activeInfo.windowId);
    });
  }

  async handleTabActivated(tabId, windowId) {
    console.log(`Handling tab activated: ${tabId}, Window: ${windowId}`);
    if (!this.windowLists.has(windowId)) {
      this.windowLists.set(windowId, new TabHistoryList());
    }

    this.windowLists.get(windowId).addToFront(tabId);
  }

  getPreviousTabWithId(windowId) {
    if (this.windowLists.has(windowId)) {
      const prevNode = this.windowLists.get(windowId).head.prev;
      return prevNode ? prevNode.tabId : null;
    }
    return null;
  }

  async getPreviousTab() {
    let windowId = (await chrome.windows.getCurrent()).id;
    return this.getPreviousTabWithId(windowId);
  }
}

const tabManager = new TabManager();
