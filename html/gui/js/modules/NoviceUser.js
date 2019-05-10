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
                    var userTour = self.createNewUserTour();

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
                                        msg: "Welcome to XDMoD. It seems that you haven't viewed our User Tour yet. The User Tour is a short series of information tips giving an overview of some basic components of XDMoD. If you want to view the tour now click Yes below.<br /><br /><input type='checkbox' id='new-user-tour-checkbox' /> Please don't show me this again.",
                                        buttons: Ext.Msg.YESNO,
                                        icon: Ext.Msg.INFO,
                                        fn: function(buttonValue, inputText, showConfig){
                                            var newUserTourCheckbox = Ext.select('#new-user-tour-checkbox');
                                            if (buttonValue === 'yes') {
                                                userTour.startTour();
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
                                                        Ext.Msg.alert('Status', 'This message will not be displayed again. If you wish to view the User Tour in the future a link to it can be found by clicking the Help button in the upper right corner of the page.');
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
                         high performance computing resources. <br /><br />Open XDMoD’s management capabilities
                         include monitoring standard metrics such as utilization, providing quality of service
                         metrics designed to proactively identify underperforming system hardware and software.`,
                  target: "#tg_summary",
                  position: "t-t"
              }),
              new Ext.ux.HelpTip({
                  html: `The XDMoD User Interface contains a wealth of information and has been organized into tabs
                         to compartmentalize the data.<ul>
                         <li>
                         The Summary tab provides a dashboard that presents summary statistics and selected charts
                         that are useful to the role of the current user.
                         </li>
                         <li>
                         The Usage tab provides a convenient way to browse all the realms present in XDMoD.
                         Interacting with the chart selection tree or “chart thumbnails” allows you to view charts
                         in more detail.
                         </li>
                         <li>
                         The Metric Explorer tab allows one to create complex plots containing multiple metrics. It
                         has many point & click features that allow the user to easily add, filter, and modify
                         the data and the format in which it is presented.
                         </li></ul>`,
                  target: "#main_tab_panel .x-tab-panel-header",
                  position: "tl-bl",
                  maxWidth: 400,
                  offset: [20, 0]
              }),
              new Ext.ux.HelpTip({
                  html: `Your are currently on the Summary tab which provides a snapshot overview of selected
                         data with several small summary charts that display information such as the number
                         of jobs run, average CPU time per job, and the average number of processors per job are
                         displayed as well as selected charts that provide an overview of of selected available.`,
                  target: "#tg_summary",
                  position: "t-t"
              }),
              new Ext.ux.HelpTip({
                  html: `The Summary tab is made up of several informational boxes called portlets. Each portlet
                         contains summary statistics, selected charts or other pieces of information that are
                         useful to the role of the current user. `,
                  target: ".x-portlet:first",
                  position: "l-r"
              }),
              new Ext.ux.HelpTip({
                  html: `From left to right, this toolbar provides a button for collapsing the portlet, a button
                         to configure the chart, and a button that when hovered over will present a tooltip to
                         describe the data in the chart.`,
                  target: ".x-portlet:first .x-panel-header:first",
                  position: 'tl-br',
                  offset: [-10, 0]
              }),
              new Ext.ux.HelpTip({
                  html: `The Help button is located in the upper right corner of the screen and clicking on it
                         will provide you with the following options: User Manual, FAQ and YouTube
                         Channel.<br /><br />Clicking on User Manual will direct the user to the XDMoD User Manual.
                         If help is available for the section of XDMoD you currently are visiting, the User Manual
                         will automatically navigate to the respective section when it loads. Clicking on FAQ
                         will take you to a page containing Frequently Asked Questions.`,
                  target: "#help_button",
                  position: "tr-bl"
              }),
              new Ext.ux.HelpTip({
                  html: `The 'My Profile' button allows you to view and update general settings pertaining to your
                         account. Your current role will be displayed in the title bar of the My Profile window.
                         <br /><br />The first section in the My Profile window contains User Information such as:
                         First Name, Last Name, and Email Address.  All of the aforementioned fields must be
                         specified in order to update your profile.`,
                  target: "#global-toolbar-profile",
                  position: "tl-bl",
              }),
              new Ext.ux.HelpTip({
                  html: `Thank you for viewing the XDMoD User Tour. If you want to view this tour again you can
                         find it by clicking on the Help button in the upper right corner.`,
                  target: "#tg_summary",
                  position: "t-t",
                  listeners: {
                      show: function(){
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
                            method: 'POST'
                        }); //conn.request
                      }
                  }
              })
            ]
        });

        if (CCR.xdmod.publicUser !== true) {
            Ext.get('help_button').on('click', function(){
                Ext.get('global-toolbar-help-new-user-tour').on('click', function(){
                    userTour.startTour();
                })
            });
        }

        return userTour;
    }
});
