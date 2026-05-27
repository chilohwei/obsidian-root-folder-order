const { Notice, Plugin, PluginSettingTab, Setting } = require("obsidian");

const PATCHED = Symbol("root-folder-order-patched");
const ORIGINAL_SORT = Symbol("root-folder-order-original-sort");

const LANGUAGES = new Set(["auto", "en", "zh"]);
const CONFIGURED_POSITIONS = new Set(["top", "bottom"]);
const UNCONFIGURED_SORTS = new Set(["obsidian", "alphabetical", "alphabeticalReverse"]);

const DEFAULT_SETTINGS = {
  language: "auto",
  folderOrder: [],
  configuredPosition: "top",
  unconfiguredSort: "obsidian",
  autoAddNewFolders: false,
  trackRenamedFolders: true,
  removeDeletedFolders: false,
};

const STRINGS = {
  en: {
    commandOpenSettings: "Open root folder order settings",
    commandRefresh: "Refresh root folder order",
    commandAddMissing: "Add missing root folders to order",
    noticeRefreshed: "Root folder order refreshed",
    noticeNoMissing: "No missing root folders",
    noticeAdded: "Added {count} root folder(s)",
    noticeEnterFolder: "Enter a folder name first",
    noticeRootOnly: "Only root-level folders are supported",
    noticeAlreadyListed: "Folder is already in the order list",
    noticeRemovedMissing: "Removed {count} missing folder(s)",
    noticeNoMissingEntries: "No missing entries",
    noticeCreated: "Created {path}",
    noticeCreateFailed: "Failed to create {path}",
    noticeInvalidRoot: "Only root-level folders are supported: {path}",
    title: "Root folder order",
    intro: "Set the order once. Changes apply to the file explorer immediately.",
    quickStart: "Quick start",
    languageName: "Language",
    languageDesc: "Choose the settings language.",
    languageAuto: "Auto",
    languageEnglish: "English",
    languageChinese: "中文",
    addCurrentName: "Add current root folders",
    addCurrentDesc: "Adds root folders that are not already in the list.",
    addMissingButton: "Add current",
    addManualName: "Add folder by name",
    addManualDesc: "Adds a root folder to the order list, even if it does not exist yet.",
    addManualPlaceholder: "Folder name",
    addButton: "Add",
    currentOrder: "Current order",
    emptyOrder: "No folders configured. Add current root folders to start.",
    positionLabel: "Position for {path}",
    present: "present",
    missing: "missing",
    moveUp: "Up",
    moveDown: "Down",
    create: "Create",
    remove: "Remove",
    advanced: "Advanced options",
    behavior: "Behavior",
    configuredPositionName: "Configured folders position",
    configuredPositionDesc: "Choose whether configured root folders are pinned before or after unconfigured folders.",
    top: "Top",
    bottom: "Bottom",
    unconfiguredName: "Unconfigured folders",
    unconfiguredDesc: "Choose how root folders that are not in the custom list should be sorted.",
    unconfiguredObsidian: "Use Obsidian order",
    unconfiguredAz: "Alphabetical A to Z",
    unconfiguredZa: "Alphabetical Z to A",
    autoAddName: "Auto-add new root folders",
    autoAddDesc: "When a new root folder appears, append it to the configured order.",
    trackRenameName: "Track root folder renames",
    trackRenameDesc: "When a configured root folder is renamed, update the saved order entry.",
    removeDeletedName: "Remove deleted root folders",
    removeDeletedDesc: "When a configured root folder is deleted or moved away from the vault root, remove it from the order.",
    maintenance: "Maintenance",
    pruneMissingName: "Remove missing entries",
    pruneMissingDesc: "Removes configured folders that do not currently exist at the vault root.",
    pruneMissingButton: "Remove missing",
    resetName: "Reset to current root folders",
    resetDesc: "Replaces the list with all current root folders in alphabetical order.",
    resetButton: "Reset",
    bulkEdit: "Bulk edit",
    bulkName: "Order list",
    bulkDesc: "One root folder name per line. Applying replaces the current configured order.",
    bulkPlaceholder: "Reading\nClips\nNotes",
    apply: "Apply",
  },
  zh: {
    commandOpenSettings: "打开根目录排序设置",
    commandRefresh: "刷新根目录排序",
    commandAddMissing: "添加缺失的根目录到排序",
    noticeRefreshed: "根目录排序已刷新",
    noticeNoMissing: "没有缺失的根目录",
    noticeAdded: "已添加 {count} 个根目录",
    noticeEnterFolder: "请先输入目录名",
    noticeRootOnly: "仅支持根目录",
    noticeAlreadyListed: "该目录已在排序列表中",
    noticeRemovedMissing: "已移除 {count} 个缺失目录",
    noticeNoMissingEntries: "没有缺失条目",
    noticeCreated: "已创建 {path}",
    noticeCreateFailed: "创建失败：{path}",
    noticeInvalidRoot: "仅支持根目录：{path}",
    title: "根目录排序",
    intro: "设置一次顺序，文件列表会立即生效。",
    quickStart: "快速开始",
    languageName: "语言",
    languageDesc: "选择设置页语言。",
    languageAuto: "自动",
    languageEnglish: "English",
    languageChinese: "中文",
    addCurrentName: "添加当前根目录",
    addCurrentDesc: "把还不在列表里的根目录加入排序。",
    addMissingButton: "添加当前",
    addManualName: "按名称添加目录",
    addManualDesc: "添加一个根目录到排序列表，即使它还不存在。",
    addManualPlaceholder: "目录名",
    addButton: "添加",
    currentOrder: "当前顺序",
    emptyOrder: "还没有配置目录。先添加当前根目录即可开始。",
    positionLabel: "{path} 的位置",
    present: "存在",
    missing: "缺失",
    moveUp: "上移",
    moveDown: "下移",
    create: "创建",
    remove: "移除",
    advanced: "高级选项",
    behavior: "行为",
    configuredPositionName: "已配置目录位置",
    configuredPositionDesc: "选择已配置的根目录显示在未配置目录之前还是之后。",
    top: "顶部",
    bottom: "底部",
    unconfiguredName: "未配置目录",
    unconfiguredDesc: "选择不在排序列表里的根目录如何排序。",
    unconfiguredObsidian: "使用 Obsidian 当前顺序",
    unconfiguredAz: "按名称 A 到 Z",
    unconfiguredZa: "按名称 Z 到 A",
    autoAddName: "自动添加新根目录",
    autoAddDesc: "新建根目录时，自动追加到排序列表。",
    trackRenameName: "跟踪根目录重命名",
    trackRenameDesc: "已配置根目录被重命名时，自动更新保存的排序项。",
    removeDeletedName: "移除已删除根目录",
    removeDeletedDesc: "已配置根目录被删除或移出根目录时，自动从排序列表移除。",
    maintenance: "维护",
    pruneMissingName: "移除缺失条目",
    pruneMissingDesc: "移除当前不存在于 vault 根目录下的配置项。",
    pruneMissingButton: "移除缺失",
    resetName: "重置为当前根目录",
    resetDesc: "用当前所有根目录按字母顺序替换排序列表。",
    resetButton: "重置",
    bulkEdit: "批量编辑",
    bulkName: "排序列表",
    bulkDesc: "每行一个根目录名。应用后会替换当前排序。",
    bulkPlaceholder: "读书\n剪藏\n笔记",
    apply: "应用",
  },
};

module.exports = class RootFolderOrderPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    this.settingTab = new RootFolderOrderSettingTab(this.app, this);
    this.addSettingTab(this.settingTab);

    this.addCommand({
      id: "open-folder-order-settings",
      name: this.t("commandOpenSettings"),
      callback: () => {
        this.app.setting.open();
        this.app.setting.openTabById(this.manifest.id);
      },
    });

    this.addCommand({
      id: "refresh-folder-order",
      name: this.t("commandRefresh"),
      callback: () => {
        this.refreshSort();
        new Notice(this.t("noticeRefreshed"));
      },
    });

    this.addCommand({
      id: "add-missing-root-folders",
      name: this.t("commandAddMissing"),
      callback: async () => {
        const added = await this.addMissingRootFolders();
        new Notice(added ? this.t("noticeAdded", { count: added }) : this.t("noticeNoMissing"));
      },
    });

    this.app.workspace.onLayoutReady(() => {
      this.patchFileExplorerViews();
      this.refreshSort();
    });

    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.patchFileExplorerViews();
        this.refreshSort();
      })
    );

    this.registerEvent(this.app.vault.on("create", (file) => this.onVaultCreate(file)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.onVaultDelete(file)));
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => this.onVaultRename(file, oldPath))
    );
  }

  onunload() {
    for (const leaf of this.app.workspace.getLeavesOfType("file-explorer")) {
      const view = leaf.view;
      if (view?.[PATCHED] && view[ORIGINAL_SORT]) {
        view.getSortedFolderItems = view[ORIGINAL_SORT];
        delete view[PATCHED];
        delete view[ORIGINAL_SORT];
        view.requestSort?.();
      }
    }
  }

  async loadSettings() {
    this.settings = this.normalizeSettings(await this.loadData());
  }

  normalizeSettings(data) {
    const settings = Object.assign({}, DEFAULT_SETTINGS, data || {});
    settings.language = LANGUAGES.has(settings.language)
      ? settings.language
      : DEFAULT_SETTINGS.language;
    settings.folderOrder = this.normalizeOrder(settings.folderOrder);
    settings.configuredPosition = CONFIGURED_POSITIONS.has(settings.configuredPosition)
      ? settings.configuredPosition
      : DEFAULT_SETTINGS.configuredPosition;
    settings.unconfiguredSort = UNCONFIGURED_SORTS.has(settings.unconfiguredSort)
      ? settings.unconfiguredSort
      : DEFAULT_SETTINGS.unconfiguredSort;
    settings.autoAddNewFolders = Boolean(settings.autoAddNewFolders);
    settings.trackRenamedFolders = Boolean(settings.trackRenamedFolders);
    settings.removeDeletedFolders = Boolean(settings.removeDeletedFolders);
    return settings;
  }

  async saveSettings(options = {}) {
    this.settings = this.normalizeSettings(this.settings);
    await this.saveData(this.settings);
    this.refreshSort();
    if (options.rerenderSettings) {
      this.refreshSettingsTab();
    }
  }

  getLanguage() {
    if (this.settings.language !== "auto") {
      return this.settings.language;
    }
    const htmlLang = document.documentElement.lang || "";
    const navigatorLang = navigator.language || "";
    return `${htmlLang} ${navigatorLang}`.toLowerCase().includes("zh") ? "zh" : "en";
  }

  t(key, params = {}) {
    const template = STRINGS[this.getLanguage()][key] || STRINGS.en[key] || key;
    return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ""));
  }

  normalizeOrder(order) {
    const seen = new Set();
    return Array.isArray(order)
      ? order
          .map((path) => String(path).trim())
          .filter((path) => path && !path.includes("/") && !seen.has(path) && seen.add(path))
      : [];
  }

  isFolder(file) {
    return Boolean(file?.children);
  }

  isRootFolder(file) {
    return this.isFolder(file) && file.path && !file.path.includes("/");
  }

  rootFolderExists(path) {
    const folder = this.app.vault.getAbstractFileByPath(path);
    return this.isRootFolder(folder);
  }

  getTopLevelFolders() {
    return this.app.vault
      .getRoot()
      .children.filter((child) => this.isFolder(child))
      .map((folder) => folder.path)
      .sort((a, b) => a.localeCompare(b));
  }

  getConfiguredOrderMap() {
    return new Map(this.settings.folderOrder.map((path, index) => [path, index]));
  }

  compareUnconfiguredFolders(a, b) {
    if (this.settings.unconfiguredSort === "alphabetical") {
      return a.item.file.name.localeCompare(b.item.file.name);
    }
    if (this.settings.unconfiguredSort === "alphabeticalReverse") {
      return b.item.file.name.localeCompare(a.item.file.name);
    }
    return a.index - b.index;
  }

  compareRootItems(a, b, orderMap) {
    const aIsFolder = this.isFolder(a.item.file);
    const bIsFolder = this.isFolder(b.item.file);
    if (!aIsFolder || !bIsFolder) {
      return a.index - b.index;
    }

    const aOrder = orderMap.get(a.item.file.path);
    const bOrder = orderMap.get(b.item.file.path);
    const aConfigured = aOrder !== undefined;
    const bConfigured = bOrder !== undefined;

    if (aConfigured && bConfigured) {
      return aOrder - bOrder;
    }

    if (aConfigured !== bConfigured) {
      const configuredFirst = this.settings.configuredPosition === "top";
      return aConfigured === configuredFirst ? -1 : 1;
    }

    return this.compareUnconfiguredFolders(a, b);
  }

  patchFileExplorerViews() {
    for (const leaf of this.app.workspace.getLeavesOfType("file-explorer")) {
      const view = leaf.view;
      if (!view || view[PATCHED] || typeof view.getSortedFolderItems !== "function") {
        continue;
      }

      const originalGetSortedFolderItems = view.getSortedFolderItems.bind(view);
      view[ORIGINAL_SORT] = originalGetSortedFolderItems;
      view.getSortedFolderItems = (folder) => {
        const items = originalGetSortedFolderItems(folder);
        if (!folder?.isRoot?.()) {
          return items;
        }

        const orderMap = this.getConfiguredOrderMap();
        return items
          .map((item, index) => ({ item, index }))
          .sort((a, b) => this.compareRootItems(a, b, orderMap))
          .map(({ item }) => item);
      };

      view[PATCHED] = true;
      view.requestSort?.();
    }
  }

  refreshSort() {
    for (const leaf of this.app.workspace.getLeavesOfType("file-explorer")) {
      leaf.view?.requestSort?.();
    }
  }

  refreshSettingsTab() {
    if (this.settingTab?.containerEl?.isShown?.()) {
      this.settingTab.display();
    }
  }

  async addMissingRootFolders() {
    const current = new Set(this.settings.folderOrder);
    const missing = this.getTopLevelFolders().filter((path) => !current.has(path));
    if (missing.length === 0) {
      return 0;
    }
    this.settings.folderOrder.push(...missing);
    await this.saveSettings({ rerenderSettings: true });
    return missing.length;
  }

  async pruneMissingFolders() {
    const before = this.settings.folderOrder.length;
    this.settings.folderOrder = this.settings.folderOrder.filter((path) =>
      this.rootFolderExists(path)
    );
    await this.saveSettings({ rerenderSettings: true });
    return before - this.settings.folderOrder.length;
  }

  async createConfiguredFolder(path) {
    if (this.rootFolderExists(path)) {
      return;
    }
    await this.app.vault.createFolder(path);
    this.refreshSort();
    this.refreshSettingsTab();
  }

  async onVaultCreate(file) {
    if (!this.settings.autoAddNewFolders || !this.isRootFolder(file)) {
      return;
    }
    if (!this.settings.folderOrder.includes(file.path)) {
      this.settings.folderOrder.push(file.path);
      await this.saveSettings({ rerenderSettings: true });
    }
  }

  async onVaultDelete(file) {
    if (!this.settings.removeDeletedFolders || !this.isRootFolder(file)) {
      this.refreshSettingsTab();
      return;
    }
    const before = this.settings.folderOrder.length;
    this.settings.folderOrder = this.settings.folderOrder.filter((path) => path !== file.path);
    if (before !== this.settings.folderOrder.length) {
      await this.saveSettings({ rerenderSettings: true });
    }
  }

  async onVaultRename(file, oldPath) {
    const wasRoot = oldPath && !oldPath.includes("/");
    const isRoot = this.isRootFolder(file);

    if (this.settings.trackRenamedFolders && wasRoot && isRoot) {
      const index = this.settings.folderOrder.indexOf(oldPath);
      if (index !== -1) {
        this.settings.folderOrder[index] = file.path;
        await this.saveSettings({ rerenderSettings: true });
        return;
      }
    }

    if (this.settings.removeDeletedFolders && wasRoot && !isRoot) {
      const before = this.settings.folderOrder.length;
      this.settings.folderOrder = this.settings.folderOrder.filter((path) => path !== oldPath);
      if (before !== this.settings.folderOrder.length) {
        await this.saveSettings({ rerenderSettings: true });
        return;
      }
    }

    if (this.settings.autoAddNewFolders && !wasRoot && isRoot) {
      if (!this.settings.folderOrder.includes(file.path)) {
        this.settings.folderOrder.push(file.path);
        await this.saveSettings({ rerenderSettings: true });
        return;
      }
    }

    this.refreshSort();
    this.refreshSettingsTab();
  }
};

class RootFolderOrderSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("root-folder-order-settings");
    containerEl.createEl("h2", { text: this.plugin.t("title") });
    containerEl.createEl("p", { cls: "root-folder-order-intro", text: this.plugin.t("intro") });

    this.renderQuickStart(containerEl);
    this.renderFolderList(containerEl);
    this.renderAdvancedOptions(containerEl);
  }

  renderQuickStart(containerEl) {
    containerEl.createEl("h3", { text: this.plugin.t("quickStart") });

    new Setting(containerEl)
      .setName(this.plugin.t("languageName"))
      .setDesc(this.plugin.t("languageDesc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("auto", this.plugin.t("languageAuto"))
          .addOption("zh", this.plugin.t("languageChinese"))
          .addOption("en", this.plugin.t("languageEnglish"))
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            this.plugin.settings.language = value;
            await this.plugin.saveSettings({ rerenderSettings: true });
          })
      );

    new Setting(containerEl)
      .setName(this.plugin.t("addCurrentName"))
      .setDesc(this.plugin.t("addCurrentDesc"))
      .addButton((button) =>
        button.setButtonText(this.plugin.t("addMissingButton")).onClick(async () => {
          const added = await this.plugin.addMissingRootFolders();
          new Notice(
            added
              ? this.plugin.t("noticeAdded", { count: added })
              : this.plugin.t("noticeNoMissing")
          );
        })
      );

    let folderPath = "";
    new Setting(containerEl)
      .setName(this.plugin.t("addManualName"))
      .setDesc(this.plugin.t("addManualDesc"))
      .addText((text) =>
        text
          .setPlaceholder(this.plugin.t("addManualPlaceholder"))
          .onChange((value) => {
            folderPath = value.trim();
          })
      )
      .addButton((button) =>
        button.setButtonText(this.plugin.t("addButton")).onClick(async () => {
          if (!folderPath) {
            new Notice(this.plugin.t("noticeEnterFolder"));
            return;
          }
          if (folderPath.includes("/")) {
            new Notice(this.plugin.t("noticeRootOnly"));
            return;
          }
          if (this.plugin.settings.folderOrder.includes(folderPath)) {
            new Notice(this.plugin.t("noticeAlreadyListed"));
            return;
          }
          this.plugin.settings.folderOrder.push(folderPath);
          await this.plugin.saveSettings({ rerenderSettings: true });
        })
      );
  }

  renderFolderList(containerEl) {
    containerEl.createEl("h3", { text: this.plugin.t("currentOrder") });
    const listEl = containerEl.createDiv({ cls: "root-folder-order-list" });
    this.plugin.settings.folderOrder.forEach((path, index) => {
      this.renderFolderRow(listEl, path, index);
    });

    if (this.plugin.settings.folderOrder.length === 0) {
      listEl.createDiv({
        cls: "root-folder-order-empty",
        text: this.plugin.t("emptyOrder"),
      });
    }
  }

  renderAdvancedOptions(containerEl) {
    const detailsEl = containerEl.createEl("details", { cls: "root-folder-order-advanced" });
    detailsEl.createEl("summary", { text: this.plugin.t("advanced") });
    this.renderBehaviorSettings(detailsEl);
    this.renderMaintenance(detailsEl);
    this.renderBulkEditor(detailsEl);
  }

  renderBehaviorSettings(containerEl) {
    containerEl.createEl("h3", { text: this.plugin.t("behavior") });

    new Setting(containerEl)
      .setName(this.plugin.t("configuredPositionName"))
      .setDesc(this.plugin.t("configuredPositionDesc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("top", this.plugin.t("top"))
          .addOption("bottom", this.plugin.t("bottom"))
          .setValue(this.plugin.settings.configuredPosition)
          .onChange(async (value) => {
            this.plugin.settings.configuredPosition = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(this.plugin.t("unconfiguredName"))
      .setDesc(this.plugin.t("unconfiguredDesc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("obsidian", this.plugin.t("unconfiguredObsidian"))
          .addOption("alphabetical", this.plugin.t("unconfiguredAz"))
          .addOption("alphabeticalReverse", this.plugin.t("unconfiguredZa"))
          .setValue(this.plugin.settings.unconfiguredSort)
          .onChange(async (value) => {
            this.plugin.settings.unconfiguredSort = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(this.plugin.t("autoAddName"))
      .setDesc(this.plugin.t("autoAddDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoAddNewFolders).onChange(async (value) => {
          this.plugin.settings.autoAddNewFolders = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(this.plugin.t("trackRenameName"))
      .setDesc(this.plugin.t("trackRenameDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.trackRenamedFolders).onChange(async (value) => {
          this.plugin.settings.trackRenamedFolders = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(this.plugin.t("removeDeletedName"))
      .setDesc(this.plugin.t("removeDeletedDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.removeDeletedFolders).onChange(async (value) => {
          this.plugin.settings.removeDeletedFolders = value;
          await this.plugin.saveSettings({ rerenderSettings: true });
        })
      );
  }

  renderMaintenance(containerEl) {
    containerEl.createEl("h3", { text: this.plugin.t("maintenance") });

    new Setting(containerEl)
      .setName(this.plugin.t("pruneMissingName"))
      .setDesc(this.plugin.t("pruneMissingDesc"))
      .addButton((button) =>
        button.setButtonText(this.plugin.t("pruneMissingButton")).onClick(async () => {
          const removed = await this.plugin.pruneMissingFolders();
          new Notice(
            removed
              ? this.plugin.t("noticeRemovedMissing", { count: removed })
              : this.plugin.t("noticeNoMissingEntries")
          );
        })
      );

    new Setting(containerEl)
      .setName(this.plugin.t("resetName"))
      .setDesc(this.plugin.t("resetDesc"))
      .addButton((button) =>
        button.setButtonText(this.plugin.t("resetButton")).onClick(async () => {
          this.plugin.settings.folderOrder = this.plugin.getTopLevelFolders();
          await this.plugin.saveSettings({ rerenderSettings: true });
        })
      );
  }

  renderBulkEditor(containerEl) {
    containerEl.createEl("h3", { text: this.plugin.t("bulkEdit") });
    let bulkValue = this.plugin.settings.folderOrder.join("\n");

    new Setting(containerEl)
      .setName(this.plugin.t("bulkName"))
      .setDesc(this.plugin.t("bulkDesc"))
      .addTextArea((text) =>
        text
          .setPlaceholder(this.plugin.t("bulkPlaceholder"))
          .setValue(bulkValue)
          .onChange((value) => {
            bulkValue = value;
          })
      )
      .addButton((button) =>
        button.setButtonText(this.plugin.t("apply")).onClick(async () => {
          const nextOrder = bulkValue
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
          const invalid = nextOrder.find((path) => path.includes("/"));
          if (invalid) {
            new Notice(this.plugin.t("noticeInvalidRoot", { path: invalid }));
            return;
          }
          this.plugin.settings.folderOrder = nextOrder;
          await this.plugin.saveSettings({ rerenderSettings: true });
        })
      );
  }

  renderFolderRow(parentEl, path, index) {
    const exists = this.plugin.rootFolderExists(path);
    const rowEl = parentEl.createDiv({ cls: "root-folder-order-row" });
    rowEl.toggleClass("is-missing", !exists);
    rowEl.draggable = true;
    rowEl.dataset.index = String(index);

    rowEl.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", String(index));
      event.dataTransfer.effectAllowed = "move";
      rowEl.addClass("is-dragging");
    });

    rowEl.addEventListener("dragend", () => {
      rowEl.removeClass("is-dragging");
    });

    rowEl.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });

    rowEl.addEventListener("drop", async (event) => {
      event.preventDefault();
      const fromIndex = Number(event.dataTransfer.getData("text/plain"));
      if (Number.isNaN(fromIndex) || fromIndex === index) {
        return;
      }
      await this.moveFolder(fromIndex, index);
    });

    rowEl.createDiv({ cls: "root-folder-order-drag", text: "::" });

    const positionInput = rowEl.createEl("input", {
      cls: "root-folder-order-position",
      attr: {
        type: "number",
        min: "1",
        value: String(index + 1),
        "aria-label": this.plugin.t("positionLabel", { path }),
      },
    });
    positionInput.addEventListener("change", async () => {
      const targetIndex = Number(positionInput.value) - 1;
      if (Number.isNaN(targetIndex)) {
        positionInput.value = String(index + 1);
        return;
      }
      await this.moveFolder(index, targetIndex);
    });

    const nameEl = rowEl.createDiv({ cls: "root-folder-order-name" });
    nameEl.createSpan({ text: path });
    nameEl.createSpan({
      cls: exists ? "root-folder-order-status is-present" : "root-folder-order-status is-missing",
      text: exists ? this.plugin.t("present") : this.plugin.t("missing"),
    });

    const controlsEl = rowEl.createDiv({ cls: "root-folder-order-controls" });
    controlsEl
      .createEl("button", {
        text: this.plugin.t("moveUp"),
        attr: { type: "button", "aria-label": this.plugin.t("moveUp") },
      })
      .addEventListener("click", async () => this.moveFolder(index, index - 1));
    controlsEl
      .createEl("button", {
        text: this.plugin.t("moveDown"),
        attr: { type: "button", "aria-label": this.plugin.t("moveDown") },
      })
      .addEventListener("click", async () => this.moveFolder(index, index + 1));

    if (!exists) {
      controlsEl
        .createEl("button", {
          text: this.plugin.t("create"),
          attr: { type: "button", "aria-label": this.plugin.t("create") },
        })
        .addEventListener("click", async () => {
          try {
            await this.plugin.createConfiguredFolder(path);
            new Notice(this.plugin.t("noticeCreated", { path }));
          } catch (error) {
            console.error(error);
            new Notice(this.plugin.t("noticeCreateFailed", { path }));
          }
        });
    }

    controlsEl
      .createEl("button", {
        text: this.plugin.t("remove"),
        attr: { type: "button", "aria-label": this.plugin.t("remove") },
      })
      .addEventListener("click", async () => {
        this.plugin.settings.folderOrder.splice(index, 1);
        await this.plugin.saveSettings({ rerenderSettings: true });
      });
  }

  async moveFolder(fromIndex, rawToIndex) {
    const order = this.plugin.settings.folderOrder;
    const toIndex = Math.max(0, Math.min(order.length - 1, rawToIndex));
    if (fromIndex < 0 || fromIndex >= order.length || fromIndex === toIndex) {
      this.display();
      return;
    }

    const [path] = order.splice(fromIndex, 1);
    order.splice(toIndex, 0, path);
    await this.plugin.saveSettings({ rerenderSettings: true });
  }
}
