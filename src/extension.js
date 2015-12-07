'use strict';

const Lang = imports.lang;

const St = imports.gi.St;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Mainloop = imports.mainloop;

const GLib = imports.gi.GLib;

const Indicator = new Lang.Class({
  Name: 'AndroidBatteryIndicator',
  Extends: PanelMenu.Button,

  _init: function () {
    this.parent(St.Align.START);

    let box = new St.BoxLayout();
    this.actor.add_actor(box);

    this.icon = new St.Icon({ icon_name: 'battery-full-symbolic', style_class: 'system-status-icon' });
    this.label = new St.Label({ text: '...', style_class: 'extension-andb-label' });

    this.label.clutter_text.set_line_wrap(false);

    box.add_actor(this.icon);
    box.add_actor(this.label);

    let sessionCountItem = new PopupMenu.PopupMenuItem('Android battery status', { reactive: false });
    this.menu.addMenuItem(sessionCountItem);

    this.queryAdb();

    let _loop = Mainloop.timeout_add_seconds(10, Lang.bind(this, this.queryAdb));

    this.connect('destroy', function () {
      Mainloop.source_remove(_loop);
    });
  },

  _get_bat_info: function () {
    let output = GLib.spawn_command_line_sync('/usr/bin/env adb shell dumpsys battery')[1].toString().trim();
    let lines = output.split('\n');
    let res = new Map();

    for (let i = 1; i < lines.length - 1; i++) {
      let vals = lines[i].trim().split(': ');
      if (vals.length === 2) {
        res.set(vals[0].trim().toLowerCase(), vals[1].trim());
      }
    }

    return res;
  },

  queryAdb: function () {
    let bat = this._get_bat_info();

    let img, val;

    if (bat.has('level')) {
      val = bat.get('level') + '%';
      let intVal = parseInt(bat.get('level'), 10);

      if (intVal === 100) {
        img = 'battery-full-charged-symbolic';
      } else if (intVal > 75) {
        img = 'battery-good-charging-symbolic';
      } else if (intVal > 50) {
        img = 'battery-low-charging-symbolic';
      } else if (intVal > 25) {
        img = 'battery-empty-charging-symbolic';
      } else {
        img = 'battery-caution-charging-symbolic';
      }
    } else {
      val = '?';
      img = 'battery-missing-symbolic';
    }

    this.label.set_text(val);
    this.icon.icon_name = img;

    return true;
  },
});

let indicator;

function init(metadata) {}

function enable() {
  if (!indicator) {
    indicator = new Indicator();
    Main.panel.addToStatusArea('android-battery', indicator);
  }
}

function disable() {
  if (indicator) {
    indicator.destroy();
    indicator = null;
  }
}
