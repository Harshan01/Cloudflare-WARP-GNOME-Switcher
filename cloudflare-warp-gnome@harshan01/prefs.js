'use strict';

const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const schema = ExtensionUtils.getCurrentExtension().metadata['settings-schema'];

// eslint-disable-next-line no-unused-vars
function init () {}

// eslint-disable-next-line no-unused-vars
function buildPrefsWidget () {
    let widget = new WARPSwitcherPrefsWidget();
    widget.show_all();
    return widget;
}

const WARPSwitcherPrefsWidget = GObject.registerClass(
    class WARPSwitcherPrefsWidget extends Gtk.Box {

        _init (params) {

            super._init(params);

            this.margin = 20;
            this.set_spacing(15);
            this.set_orientation(Gtk.Orientation.VERTICAL);

            const settings = ExtensionUtils.getSettings(schema);

            this.connect('destroy', Gtk.main_quit);

            let fieldStatusCheckFreqLabel = new Gtk.Label({
                label : 'Status Check Frequency (in seconds)'
            });

            let fieldStatusCheckFreq = new Gtk.SpinButton();
            fieldStatusCheckFreq.set_sensitive(true);
            fieldStatusCheckFreq.set_range(1, 3600);
            fieldStatusCheckFreq.set_value(10);
            fieldStatusCheckFreq.set_increments(1, 2);

            settings.bind(
                'status-check-freq',
                fieldStatusCheckFreq,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            let hBox = new Gtk.Box();
            hBox.set_orientation(Gtk.Orientation.HORIZONTAL);

            hBox.pack_start(fieldStatusCheckFreqLabel, false, false, 0);
            hBox.pack_end(fieldStatusCheckFreq, false, false, 0);

            this.add(hBox);
        }

    });

