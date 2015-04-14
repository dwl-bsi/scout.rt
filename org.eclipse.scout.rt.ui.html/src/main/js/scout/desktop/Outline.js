scout.Outline = function() {
  scout.Outline.parent.call(this);
  this._addAdapterProperties('defaultDetailForm');
  this.navigateUpInProgress = false; // see NavigateUpButton.js
  this.containerClasses += ' outline';
  this._treeItemPaddingLeft = 37;
  this._treeItemPaddingLevel = 20;
  this._tableSelectionListener;
};
scout.inherits(scout.Outline, scout.Tree);

scout.Outline.prototype._createKeyStrokeAdapter = function() {
  return new scout.OutlineKeyStrokeAdapter(this);
};

scout.Outline.prototype._installKeyStrokeAdapter = function() {
  if (!scout.keyStrokeManager.isAdapterInstalled(this.keyStrokeAdapter)) {
    scout.keyStrokeManager.installAdapter(this.$container.closest('.scout'), this.keyStrokeAdapter);
  }
};

/**
 * @override
 */
scout.Outline.prototype._render = function($parent) {
  scout.Outline.parent.prototype._render.call(this, $parent);

  if (this.selectedNodeIds.length === 0) {
    this._showDefaultDetailForm();
  }
};

/**
 * @override
 */
scout.Outline.prototype._renderEnabled = function() {
  scout.Outline.parent.prototype._renderEnabled.call(this);
  this.$container.setTabbable(false);
};

/**
 * @override
 */
scout.Outline.prototype._initTreeNode = function(parentNode, node) {
  scout.Outline.parent.prototype._initTreeNode.call(this, parentNode, node);
  node.detailFormVisibleByUi = true;
  // FIXME AWE: (outline) bezeichner detailTable ist nicht konsistent zu java code, dort ist es nur "table"
  if (node.detailTable) {
    node.detailTable = this.session.getOrCreateModelAdapter(node.detailTable, this);
    this._addOutlineNavigationButtons(node.detailTable, node);
  }
  if (node.detailForm) {
    node.detailForm = this.session.getOrCreateModelAdapter(node.detailForm, this);
    this._addOutlineNavigationButtons(node.detailForm, node);
  }
};

scout.Outline.prototype._addOutlineNavigationButtons = function(formOrTable, node) {
  var menus = scout.arrays.ensure(formOrTable.staticMenus);
  if (!this._hasButton(menus, scout.NavigateUpButton)) {
    var upButton = new scout.NavigateUpButton(this, node);
    menus.push(upButton);
  }
  if (!this._hasButton(menus, scout.NavigateDownButton)) {
    var downButton = new scout.NavigateDownButton(this, node);
    menus.push(downButton);
  }
  if (formOrTable instanceof scout.Form) {
    formOrTable.rootGroupBox.staticMenus = menus;
  } else {
    var table = formOrTable,
      button = this._getButton(menus, scout.NavigateDownButton);
    table.staticMenus = menus;
    this._tableSelectionListener = table.events.on(scout.Table.GUI_EVENT_ROWS_SELECTED, function(event) {
      button.updateEnabled();
    });
  }
};

scout.Outline.prototype._getButton = function(menus, buttonClass) {
  for (var i = 0; i < menus.length; i++) {
    if (menus[i] instanceof buttonClass) {
      return menus[i];
    }
  }
  return null;
};


scout.Outline.prototype._hasButton = function(menus, buttonClass) {
  return this._getButton(menus, buttonClass) !== null;
};

scout.Outline.prototype._onNodeDeleted = function(node) {
  // Destroy table, which is attached at the root adapter. Form gets destroyed by form close event
  if (node.detailTable) {
    node.detailTable.events.off(this._tableSelectionListener);
    node.detailTable.destroy();
    node.detailTable = null;
  }
};

scout.Outline.prototype._renderSelection = function() {
  scout.Outline.parent.prototype._renderSelection.call(this);

  // Outline does not support multi selection -> [0]
  var node = this.nodesMap[this.selectedNodeIds[0]];
  if (node) {
    this._updateOutlineTab(node);
  } else {
    this._showDefaultDetailForm();
  }
};

scout.Outline.prototype.setNodesSelected = function(nodes) {
  scout.Outline.parent.prototype.setNodesSelected.call(this, nodes);
  if (this.navigateUpInProgress) {
    this.navigateUpInProgress = false;
  } else {
    nodes = scout.arrays.ensure(nodes);
    if (nodes.length === 1) {
      // When a node is selected, the detail form should never be hidden
      nodes[0].detailFormVisibleByUi = true;
    }
  }
};

scout.Outline.prototype._showDefaultDetailForm = function() {
  var form = this.defaultDetailForm;
  if (form) {
    this.session.desktop.updateOutlineTab(form, form.title);
    this.events.trigger('outlineUpdated', {});
  }
};

scout.Outline.prototype._updateOutlineTab = function(node) {
  // FIXME AWE: (outline) remove these errors if error never occurs in application
  if (!node) {
    throw new Error('called updateOutlineTab without node, should call showDefaultDetailForm instead?');
  }
  if (this.session.desktop.outline !== this) {
    throw new Error('called updateOutlineTab but event affects another outline');
  }

  // Unlink detail form if it was closed.
  // May happen in the following case:
  // The form gets closed on execPageDeactivated.
  // No pageChanged event will be fired because the deactivated page is not selected anymore
  var content, parentText, nodeText, title, subTitle;
  if (node.detailForm && node.detailForm.destroyed) {
    node.detailForm = null;
  }

  if (node.detailForm && node.detailFormVisible && node.detailFormVisibleByUi) {
    content = node.detailForm;
  } else if (node.detailTable && node.detailTableVisible) {
    content = node.detailTable;
  }

  if (node.parentNode && node.parentNode.text) {
    parentText = node.parentNode.text;
  }
  if (node.detailForm && node.detailForm.title) {
    nodeText = node.detailForm.title;
  } else {
    nodeText = node.text;
  }

  if (parentText && nodeText) {
    title = parentText;
    subTitle = nodeText;
  } else if (parentText) {
    title = parentText;
  } else if (nodeText) {
    title = nodeText;
  }
  this.session.desktop.updateOutlineTab(content, title, subTitle);
  this.events.trigger('outlineUpdated', {
    node: node
  });
};

/**
 * Returns the selected row or null when no row is selected. When multiple rows are selected
 * the first selected row is returned.
 */
scout.Outline.prototype.selectedRow = function() {
  var table, rowId, node, nodes = this.selectedNodes();
  if (nodes.length === 0) {
    return null;
  }
  node = nodes[0];
  if (!node.detailTable) {
    return null;
  }
  table = node.detailTable;
  if (!table.selectedRowIds || table.selectedRowIds.length === 0) {
    return null;
  }
  rowId = table.selectedRowIds[0];
  return table.rowById(rowId);
};

/* event handling */

scout.Outline.prototype._onPageChanged = function(event) {
  if (event.nodeId) {
    var node = this.nodesMap[event.nodeId];

    node.detailFormVisible = event.detailFormVisible;
    node.detailForm = this.session.getOrCreateModelAdapter(event.detailForm, this);
    if (node.detailForm) {
      this._addOutlineNavigationButtons(node.detailForm, node);
    }

    node.detailTableVisible = event.detailTableVisible;
    node.detailTable = this.session.getOrCreateModelAdapter(event.detailTable, this);
    if (node.detailTable) {
      this._addOutlineNavigationButtons(node.detailTable, node);
    }

    // If the following condition is false, the selection state is not synchronized yet which
    // means there is a selection event in the queue which will be processed right afterwards.
    if (this.selectedNodeIds.indexOf(node.id) !== -1) {
      this._updateOutlineTab(node);
    }
  } else {
    this.defaultDetailForm = this.session.getOrCreateModelAdapter(event.detailForm, this);
    this._showDefaultDetailForm();
  }
};

scout.Outline.prototype.onModelAction = function(event) {
  if (event.type === 'pageChanged') {
    this._onPageChanged(event);
  } else {
    scout.Outline.parent.prototype.onModelAction.call(this, event);
  }
};
