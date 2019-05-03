/**
 * @class Ext.ux.HelpTip
 * @extends Ext.Tip
 * @author: Greg Dean
 *
 * Creates a new component called HelpTip which is an extension of Ext.Tip. When creating provide
 * the html to be shown in the tip, a css selector as a target for the tip and where the tip's position
 * in relation to the target element.
 *
 * var helpTip = new Ext.ux.HelpTip({
 *   html: "Some html",
 *   target: "#a_css_selector",
 *   position: "tl-br"
 * });
 */
Ext.ux.HelpTip = Ext.extend(Ext.Tip, {

    cls: 'help-tip',
    bodyCssClass: 'help-tip-body',
    baseCls: 'base-help-tip',
    bodyStyle: {'background-color': '#E9F3FF', 'padding': '5px', 'border': '1px solid #bbb'},
    spotlight: null,
    bbar: [],
    autoHide: false,
    closable: true,
    offset: null,
    initComponent : function(){
        Ext.ToolTip.superclass.initComponent.call(this);
    },
    listeners: {
        hide: function(){
            this.spotlight.hide();
        }
    },
    // private
    onRender : function(ct, position){
        Ext.ToolTip.superclass.onRender.call(this, ct, position);
        this.anchorCls = 'x-tip-anchor-top';
        this.anchorEl = this.el.createChild({
            cls: 'x-tip-anchor ' + this.anchorCls
        });
    },

    // private
    afterRender : function(){
        Ext.ToolTip.superclass.afterRender.call(this);
        this.anchorEl.setStyle('z-index', this.el.getZIndex() + 1).setVisibilityMode(Ext.Element.DISPLAY);
    },

    syncAnchor : function(){
        var anchorPos, targetPos, offset;
        switch('t') {
            case 't':
                anchorPos = 'b';
                targetPos = 'tl';
                offset = [10+this.anchorOffset, 2];
                break;
            case 'r':
                anchorPos = 'l';
                targetPos = 'tr';
                offset = [-2, 11+this.anchorOffset];
                break;
            case 'b':
                anchorPos = 't';
                targetPos = 'bl';
                offset = [10+this.anchorOffset, -2];
                break;
            default:
                anchorPos = 'r';
                targetPos = 'tl';
                offset = [12, 11+this.anchorOffset];
                break;
        }
        this.anchorEl.alignTo(this.el, anchorPos+'-'+targetPos, offset);
    },

    showBy : function(el, pos){
        if(!this.rendered){
           this.render(Ext.getBody());
        }

        this.createSpotlight();
        this.spotlight.show(el);
        var position = this.el.getAlignToXY(el, pos);
        var anchor_pos = pos.split('-');
        var p = (anchor_pos.length > 1) ? anchor_pos[1] : anchor_pos[0];

        var elem = Ext.get(el)
        /*console.log(p);
        console.log(elem);
        var anchorF = elem.getAnchorXY(p, false);
        var anchorT = elem.getAnchorXY(p, true);
        console.log(anchorF);
        console.log(anchorT);*/
        position[0] -= 10;
        position[1] += 7;

        if(this.offset !== null){
            position[0] += this.offset[0];
            position[1] += this.offset[1];
        }

        this.showAt(position);
        this.syncAnchor();
    },

    hideTip : function(){
      this.spotlight.hide();
      this.hide();
    },

    createSpotlight: function(){
        if(this.spotlight === null){
            this.spotlight =  new Ext.ux.Spotlight({
              easing: 'easeOut',
              duration: .3
            });
        }
    }
});
