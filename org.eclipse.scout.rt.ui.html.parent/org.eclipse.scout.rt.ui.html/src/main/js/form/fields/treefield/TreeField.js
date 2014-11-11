// SCOUT GUI
// (c) Copyright 2013-2014, BSI Business Systems Integration AG

scout.TreeField = function() {
  scout.TreeField.parent.call(this);
  this._addAdapterProperties(['tree']);
};
scout.inherits(scout.TreeField, scout.FormField);

scout.TreeField.prototype._render = function($parent) {
  this.addContainer($parent, 'tree-field');
  this.addLabel();
  this.addStatus();
  if (this.tree) {
    this._renderTree();
  }
};

/**
 * Will also be called by model adapter on property change event
 */
scout.TreeField.prototype._renderTree = function() {
  this.tree.render(this.$container);
  this.tree.$container.addClass('field');
  this.$field = this.tree.$container;
};
