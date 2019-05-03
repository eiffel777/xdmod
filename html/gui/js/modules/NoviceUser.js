/*
 * Summary page of XDMoD.
 *
 */

XDMoD.Module.Summary = function (config) {
    XDMoD.Module.Summary.superclass.constructor.call(this, config);
};

Ext.extend(XDMoD.Module.Summary, XDMoD.PortalModule, {
    module_id: 'summary',
    usesToolbar: true,

    toolbarItems: {
        durationSelector: true
    },

    initComponent: function () {
        var self = this;

        var portletStore = new Ext.data.JsonStore({
            restful: true,
            url: XDMoD.REST.url + '/summary/portlets',
            baseParams: {
                token: XDMoD.REST.token
            },
            root: 'data',
            fields: ['name', 'type', 'config', 'column'],
            listeners: {
                load: function () {
                    var i;

                    var portletWidth = 600;
                    var portalColumns = this.reader.jsonData.portalConfig.columns;

                    var portal = new Ext.ux.Portal({
                        items: [],
                        width: Math.max(portletWidth * portalColumns, self.getWidth()),
                        border: false,
                        listeners: {
                            drop: function () {
                                var row;
                                var column;
                                var portalCol;
                                var layout = {};

                                for (column = 0; column < this.items.getCount(); column++) {
                                    portalCol = this.items.get(column);
                                    for (row = 0; row < portalCol.items.getCount(); row++) {
                                        layout[portalCol.items.get(row).name] = [row, column];
                                    }
                                }
                                Ext.Ajax.request({
                                    url: XDMoD.REST.url + '/summary/layout',
                                    params: {
                                        data: Ext.encode({
                                            columns: this.items.getCount(),
                                            layout: layout
                                        })
                                    }
                                });
                            }
                        }
                    });

                    var portalColumnsCount = Math.max(portalColumns, Math.floor(self.getWidth() / portletWidth));
                    for (i = 0; i < portalColumnsCount; i++) {
                        portal.add(new Ext.ux.PortalColumn({
                            width: portletWidth,
                            style: 'padding: 1px'
                        }));
                    }

                    var durationSelector = self.getDurationSelector();

                    var portalwindow = self.getComponent('portalwindow');
                    portalwindow.removeAll();

                    this.each(function (record) {
                        var config = record.get('config');

                        config.start_date = durationSelector.getStartDate().format('Y-m-d');
                        config.end_date = durationSelector.getEndDate().format('Y-m-d');
                        config.aggregation_unit = durationSelector.getAggregationUnit();
                        config.timeframe_label = durationSelector.getDurationLabel();

                        try {
                            var portlet = Ext.ComponentMgr.create({
                                xtype: record.get('type'),
                                name: record.get('name'),
                                config: config,
                                width: portletWidth
                            });
                            portlet.relayEvents(self, ['duration_change']);

                            if (record.get('column') === -1) {
                                // The -1 columm is the full width panel above the portal
                                portlet.setWidth(portletWidth * portalColumns);
                                portalwindow.add(portlet);
                            } else {
                                // All others go in the column based portlet view.
                                portal.items.itemAt(record.get('column')).add(portlet);
                            }
                        } catch (e) {
                            Ext.Msg.alert(
                                'Error loading portlets',
                                'The portlet ' + record.get('name') + ' (' + record.get('type') + ')<br />could not be loaded.'
                            );
                        }
                    });

                    portalwindow.add(portal);
                    portalwindow.doLayout();

                    if(CCR.xdmod.publicUser !== true){
                        var conn = new Ext.data.Connection();

                        conn.request({
                            url: XDMoD.REST.url+'/summary/viewedUserTour',
                            params: {
                                data: Ext.encode({
                                  uid: CCR.xdmod.ui.mappedPID,
                                  token: XDMoD.REST.token
                                })
                            },
                            method: 'GET',
                            callback: function(options, success, response) {
                                var resp = Ext.decode(response.responseText);
                                if(resp.data.length == 0 || !resp.data[0].viewedTour){
                                    Ext.Msg.show({
                                        cls: 'new-user-tour-dialog-container',
                                        title: "New User Tour",
                                        msg: "Welcome to XDMoD.<br /><br /><input type='checkbox' id='new-user-tour-checkbox' /> Please don't show me this again.",
                                        buttons: Ext.Msg.YESNO,
                                        icon: Ext.Msg.INFO,
                                        fn: function(buttonValue, inputText, showConfig){
                                            var newUserTourCheckbox = Ext.select('#new-user-tour-checkbox');
                                            if (buttonValue === 'yes') {
                                                self.createNewUserTour();
                                            } else if (buttonValue === 'no' && newUserTourCheckbox.elements[0].checked === true) {
                                                var conn = new Ext.data.Connection();
                                                conn.request({
                                                    url: XDMoD.REST.url + '/summary/viewedUserTour',
                                                    params: {
                                                        data: Ext.encode({
                                                            viewedTour: 1,
                                                            uid: CCR.xdmod.ui.mappedPID,
                                                            token: XDMoD.REST.token
                                                        })
                                                    },
                                                    method: 'POST',
                                                    callback: function(options, success, response) {
                                                        Ext.Msg.alert('Status', 'This message will not be displayed again. Welcome to XDMoD');
                                                    } //callback
                                                }); //conn.request
                                            }
                                        }
                                    });
                                }
                            } //callback
                        }); //conn.request
                    }
                }
            }
        });

        Ext.apply(this, {
            items: [{
                region: 'center',
                itemId: 'portalwindow',
                autoScroll: true
            }],
            listeners: {
                afterrender: function () {
                    portletStore.load();
                }
            }
        });

        XDMoD.Module.Summary.superclass.initComponent.apply(this, arguments);
    },

    newUserTourCallback: function(buttonValue, inputText, showConfig){
        var newUserTourCheckbox = Ext.select('#new-user-tour-checkbox');
        if(buttonValue === 'yes'){
            this.createNewUserTour();
        }
        else if(buttonValue === 'no' && newUserTourCheckbox.elements[0].checked === true ){
            var conn = new Ext.data.Connection();
            conn.request({
                url: XDMoD.REST.url+'/summary/viewedUserTour',
                params: {
                    data: Ext.encode({
                      viewedTour: 1,
                      uid: CCR.xdmod.ui.mappedPID,
                      token: XDMoD.REST.token
                    })
                },
                method: 'POST',
                callback: function(options, success, response) {
                    Ext.Msg.alert('Status', 'This message will not be displayed again. Welcome to XDMoD');
                } //callback
            }); //conn.request
        }
    },

    createNewUserTour: function(){
        var userTour = new Ext.ux.HelpTipTour({
            title: 'New User Tour',
            items: [
              new Ext.ux.HelpTip({
                  html: `Welcome to Open XDMoD! Open XDMoD is an open source tool to facilitate the management of
                         high performance computing resources. It is widely deployed at academic, industrial and governmental
                         HPC centers. Open XDMoD’s management capabilities include monitoring standard metrics such as
                         utilization, providing quality of service metrics designed to proactively identify underperforming
                         system hardware and software,`,
                  target: "#tg_summary",
                  position: "b-t"
              }),
              new Ext.ux.HelpTip({
                  html: `The XDMoD User Interface contains a wealth of information and has been organized into tabs
                         to compartmentalize the data. `,
                  target: "#main_tab_panel .x-tab-panel-header",
                  position: "tl-bl"
              }),
              new Ext.ux.HelpTip({
                  html: `Your are currently on the Summary tab which provides a snapshot overview of selected
                         data with several small summary charts that can be expanded to full size charts.`,
                  target: "#tg_summary",
                  position: "t-b"
              }),
              new Ext.ux.HelpTip({
                  html: "This is a portlet.",
                  target: ".x-portlet:first",
                  position: "tl-br"
              }),
              new Ext.ux.HelpTip({
                  html: `Clicking on the Help menu will provide you with the following options: User Manual, FAQ and
                         YouTube Channel. Clicking on User Manual will direct the user to the XDMoD User Manual.
                         If help is available for the section of XDMoD you currently are visiting, the User Manual will
                         automatically navigate to the respective section when it loads.  Clicking on FAQ will take you to
                         a page containing Frequently Asked  Questions.`,
                  target: "#global-toolbar-dashboard",
                  position: "tl-bl",
                  listeners: {
                      show: function(){
                          Ext.get('help_button').dom.click()
                      }
                  }
              }),
              new Ext.ux.HelpTip({
                  html: `The 'My Profile' button allows you to view and update general settings pertaining to your account.
                         Your current role will be displayed in the title bar of the My Profile window.
                         The first section in the My Profile window contains User Information such as: First Name,
                         Last Name, and Email Address.  All of the aforementioned fields must be specified in order
                         to update your profile.`,
                  target: "#global-toolbar-profile",
                  position: "tl-bl"
              })
            ]
        });

        userTour.startTour();
    }
});
