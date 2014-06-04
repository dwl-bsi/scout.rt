scout.FormField = function(model, session) {
  scout.FormField.parent.call(this, model, session);
  this.$label;
  /**
   * The status label is used for error-status and mandatory info.
   */
  this.$statusLabel;
};
scout.inherits(scout.FormField, scout.ModelAdapter);

scout.FormField.prototype._render = function($parent) {
  // TODO AWE: definitiven HTML aufbau / styles mit C.RU besprechen (vergleiche mit bsicrm.rusche.ch)
  // das normale status-label von Scout ist ein composite mit Icon. Siehe JStatusLabelEx.

  /*
  this._$label = this.$container.appendDiv(undefined, 'label', this.model.label);
  // TODO AWE: (ask C.GU) vermutlich wäre es besser, das statusLabel nur bei Bedarf zu erzeugen und
  // dann wieder wegzuwerfen
  this._$statusLabel = this.$container.appendDiv(undefined, 'status-label', ' ');
  */
};

scout.FormField.prototype._applyModel = function() {
  this._setEnabled(this.model.enabled);
  this._setValue(this.model.value);
  this._setMandatory(this.model.mandatory);
  this._setVisible(this.model.visible);
  this._setErrorStatus(this.model.errorStatus);
  this._setLabel(this.model.label);
};

scout.FormField.prototype._setEnabled = function(enabled) {
  // NOP
};

scout.FormField.prototype._setValue = function(value) {
  // NOP
};

scout.FormField.prototype._setMandatory = function(mandatory) {
  //this._updateStatusLabel(); FIXME AWE uncomment
};


scout.FormField.prototype._setErrorStatus = function(errorStatus) {
  //this._updateStatusLabel(); FIXME AWE uncomment
};

// TODO AWE (C.GU) konzept vereinheitlichen, this.model properties auf FormField kopieren,
// _setXxx überdenken (was muss im DOM passieren, was im model?)
scout.FormField.prototype.isVisible = function() {
  return this.model.visible;
};

scout.FormField.prototype._setVisible = function(visible) {
  // NOP
};

scout.FormField.prototype._setLabel = function(label) {
  if (this.$label) {
    this.$label.html(label);
  }
};

scout.FormField.prototype._updateStatusLabel = function() {
  // errorStatus has higher priority than mandatory
  var title, icon;
  if (this.model.errorStatus) {
    title = this.model.errorStatus.message;
    icon = '!';
  } else if (this.model.mandatory === true) {
    title = null;
    icon = '*';
  }

  if (icon) {
    this.$statusLabel.
      css('display', 'inline-block').
      html(icon);
    if (title) {
      this.$statusLabel.attr('title', title);
      this.$statusLabel.addClass('error-status');
    } else {
      this.$statusLabel.removeAttr('title');
      this.$statusLabel.removeClass('error-status');
    }
  } else {
    this.$statusLabel.css('display', 'none');
  }
};

scout.FormField.prototype._onModelPropertyChange = function(event) {
  if (event.hasOwnProperty('value')) {
    this._setValue(event.value);
  }
  if (event.hasOwnProperty('enabled')) {
    this._setEnabled(event.enabled);
  }
  if (event.hasOwnProperty('mandatory')) {
    this._setMandatory(event.mandatory);
  }
  if (event.hasOwnProperty('visible')) {
    this._setVisible(event.visible);
  }
  if (event.hasOwnProperty('errorStatus')) {
    this._setErrorStatus(event.errorStatus);
  }
};

