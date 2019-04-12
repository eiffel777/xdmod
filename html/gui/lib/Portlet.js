/*!
 * Ext JS Library 3.2.1
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext.ux.Portlet = Ext.extend(Ext.Panel, {
    anchor: '100%',
    frame: true,
    collapsible: true,
    draggable: true,
    cls: 'x-portlet',
    helpTour: null,
    helpTourDetails: [],
    initComponent: function() {
        this.makeHelpTour();
        this.setHelpTourStart();

        Ext.ux.Portlet.superclass.initComponent.apply(this, arguments);
    },
    makeHelpTour: function() {
        var self = this;

        if (self.helpTourDetails.tips !== undefined && self.helpTourDetails.tips.length > 0) {
            self.helpTour = new Ext.ux.HelpTipTour({
                title: self.helpTourDetails.title,
                items: []
            });
            self.helpTourDetails.tips.forEach(function(value, key) {
                var tip = new Ext.ux.HelpTip({
                    html: value.html,
                    target: value.target,
                    position: value.position
                });

                self.helpTour.items.push(tip);
            });
        }
    },
    setHelpTourStart: function() {
        var self = this;

        if (self.helpTourDetails.startAt !== undefined) {
            new Ext.util.DelayedTask(function(){
              var target = Ext.select(self.helpTourDetails.startAt);
              target.on('click', self.helpTipStartCallback, self);
            }).delay(10);
        }
    },
    helpTipStartCallback: function() {
        this.helpTour.startTour();
    }
});

Ext.reg('portlet', Ext.ux.Portlet);
