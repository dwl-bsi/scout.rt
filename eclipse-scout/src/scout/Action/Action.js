import Widget from '../Widget/Widget';
import HtmlComponent from '../Layout/HtmlComponent';
import NullLayout from '../Layout/NullLayout';

//require('./Action.less');

export const ActionStyle = Object.freeze({
    DEFAULT: 0,
    BUTTON: 1
});

export const KeyStrokeFirePolicy = Object.freeze({
    ACCESSIBLE_ONLY: 0,
    ALWAYS: 1
});

export default class Action extends Widget {

    constructor() {
        super();

        this.actionStyle = ActionStyle.DEFAULT;
        this.compact = false;
        this.iconId = null;
        this.horizontalAlignment = -1;
        this.keyStroke = null;
        this.keyStrokeFirePolicy = KeyStrokeFirePolicy.ACCESSIBLE_ONLY;
        this.selected = false;
        /**
         * This property decides whether or not the tabindex attribute is set in the DOM.
         */
        this.tabbable = false;
        this.text = null;
        /**
         * Supported action styles are:
         * - default: regular menu-look, also used in overflow menus
         * - button: menu looks like a button
         */
        this.textVisible = true;
        this.toggleAction = false;
        this.tooltipText = null;
        this.showTooltipWhenSelected = true;

        this._addCloneProperties(['actionStyle', 'horizontalAlignment', 'iconId', 'selected', 'tabbable', 'text', 'tooltipText', 'toggleAction']);
    }

    /**
     * @override
     */
    /*_createKeyStrokeContext() {
        return new scout.KeyStrokeContext();
    };*/

    _init(model) {
        super._init(model);
        //this.actionKeyStroke = this._createActionKeyStroke();
        this.resolveConsts([{
            property: 'actionStyle',
            constType: ActionStyle
        }, {
            property: 'keyStrokeFirePolicy',
            constType: KeyStrokeFirePolicy
        }]);
        this.resolveTextKeys(['text', 'tooltipText']);
        this.resolveIconIds(['iconId']);
        this._setKeyStroke(this.keyStroke);
    };

    _render() {
        this.$container = this.$parent.appendDiv('action')
            .on('click', this._onClick.bind(this));
        this.htmlComp = HtmlComponent.install(this.$container, this.session);
        this.htmlComp.setLayout(this._createLayout());
    };

    _createLayout() {
        return new NullLayout();
    };

    _renderProperties() {
        super._renderProperties();

        this._renderText();
        //this._renderIconId();
        this._renderTooltipText();
        this._renderKeyStroke();
        this._renderSelected();
        this._renderTabbable();
        this._renderCompact();
    };

    _remove() {
        this._removeText();
        this._removeIconId();
        super._remove();
    };

    setText(text) {
        this.setProperty('text', text);
    };

    _renderText() {
        var text = this.text || '';
        if (text && this.textVisible) {
            if (!this.$text) {
                // Create a separate text element to so that setting the text does not remove the icon
                this.$text = this.$container.appendSpan('content text');
                HtmlComponent.install(this.$text, this.session);
            }
            this.$text.text(text);
        } else {
            this._removeText();
        }
    };

    _removeText() {
        if (this.$text) {
            this.$text.remove();
            this.$text = null;
        }
    };

    setIconId(iconId) {
        this.setProperty('iconId', iconId);
    };

    _renderIconId() {
        var iconId = this.iconId || '';
        // If the icon is an image (and not a font icon), the scout.Icon class will invalidate the layout when the image has loaded
        if (!iconId) {
            this._removeIconId();
            return;
        }
        if (this.icon) {
            this.icon.setIconDesc(iconId);
            return;
        }
        this.icon = scout.create('Icon', {
            parent: this,
            iconDesc: iconId,
            prepend: true
        });
        this.icon.one('destroy', function() {
            this.icon = null;
        }.bind(this));
        this.icon.render();
    };

    get$Icon() {
        if (this.icon) {
            return this.icon.$container;
        }
        return $();
    };

    _removeIconId() {
        if (this.icon) {
            this.icon.destroy();
        }
    };

    /**
     * @override
     */
    _renderEnabled() {
        super._renderEnabled();
        if (this.rendered) { // No need to do this during initial rendering
            this._updateTooltip();
            this._renderTabbable();
        }
    };

    setTooltipText(tooltipText) {
        this.setProperty('tooltipText', tooltipText);
    };

    _renderTooltipText() {
        this._updateTooltip();
    };

    /**
     * Installs or uninstalls tooltip based on tooltipText, selected and enabledComputed.
     */
    _updateTooltip() {
        /*if (this._shouldInstallTooltip()) {
            scout.tooltips.install(this.$container, this._configureTooltip());
        } else {
            scout.tooltips.uninstall(this.$container);
        }*/
    };

    _shouldInstallTooltip() {
        var show = this.tooltipText && this.enabledComputed;
        if (!this.showTooltipWhenSelected && this.selected) {
            show = false;
        }
        return show;
    };

    _renderTabbable() {
        this.$container.setTabbable(this.tabbable && this.enabled);
    };

    _renderCompact() {
        this.$container.toggleClass('compact', this.compact);
        this.invalidateLayoutTree();
    };

    _configureTooltip() {
        return {
            parent: this,
            text: this.tooltipText,
            $anchor: this.$container,
            arrowPosition: 50,
            arrowPositionUnit: '%',
            tooltipPosition: this.tooltipPosition
        };
    };

    /**
     * @return {Boolean}
     *          <code>true</code> if the action has been performed or <code>false</code> if it
     *          has not been performed (e.g. when the button is not enabledComputed).
     */
    doAction() {
        if (!this.prepareDoAction()) {
            return false;
        }

        if (this.isToggleAction()) {
            this.setSelected(!this.selected);
        } else {
            this._doAction();
        }
        return true;
    };

    toggle() {
        if (this.isToggleAction()) {
            this.setSelected(!this.selected);
        }
    };

    setToggleAction(toggleAction) {
        this.setProperty('toggleAction', toggleAction);
    };

    isToggleAction() {
        return this.toggleAction;
    };

    /**
     * @returns {Boolean} <code>true</code> if the action may be executed, <code>false</code> if it should be ignored.
     */
    prepareDoAction() {
        return !(!this.enabledComputed || !this.visible);
    };

    _doAction() {
        this.trigger('action');
    };

    setSelected(selected) {
        this.setProperty('selected', selected);
    };

    _renderSelected() {
        this.$container.toggleClass('selected', this.selected);
        if (this.rendered) { // prevent unnecessary tooltip updates during initial rendering
            this._updateTooltip();
        }
    };

    setKeyStroke(keyStroke) {
        this.setProperty('keyStroke', keyStroke);
    };

    _setKeyStroke(keyStroke) {
        //this.actionKeyStroke.parseAndSetKeyStroke(keyStroke);
        this._setProperty('keyStroke', keyStroke);
    };

    _renderKeyStroke() {
        var keyStroke = this.keyStroke;
        if (keyStroke === undefined) {
            this.$container.removeAttr('data-shortcut');
        } else {
            this.$container.attr('data-shortcut', keyStroke);
        }
    };

    setTabbable(tabbable) {
        this.setProperty('tabbable', tabbable);
    };

    setTextVisible(textVisible) {
        if (this.textVisible === textVisible) {
            return;
        }
        this._setProperty('textVisible', textVisible);
        if (this.rendered) {
            this._renderText();
        }
    };

    setCompact(compact) {
        if (this.compact === compact) {
            return;
        }
        this.compact = compact;
        if (this.rendered) {
            this._renderCompact();
        }
    };

    setHorizontalAlignment(horizontalAlignment) {
        this.setProperty('horizontalAlignment', horizontalAlignment);
    };

    /*_createActionKeyStroke() {
        return new scout.ActionKeyStroke(this);
    };*/

    _allowMouseEvent(event) {
        if (event.which !== 1) {
            return false; // Other button than left mouse button --> nop
        }
        return !(event.type === 'click' && event.detail > 1 && this.preventDoubleClick);
    };

    _onClick(event) {
        if (!this._allowMouseEvent(event)) {
            return;
        }

        // When the action is clicked the user wants to execute the action and not see the tooltip -> cancel the task
        // If it is already displayed it will stay
        //scout.tooltips.cancel(this.$container);

        this.doAction();
    };

}
