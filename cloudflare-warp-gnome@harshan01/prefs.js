'use strict';

const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const schema = ExtensionUtils.getCurrentExtension().metadata['settings-schema'];

// eslint-disable-next-line no-unused-vars
function init() {}

// eslint-disable-next-line no-unused-vars
function buildPrefsWidget() {
    let widget = new WARPSwitcherPrefsWidget();
    if (widget.show_all)
        widget.show_all();
    return widget;
}

const WARPSwitcherPrefsWidget = GObject.registerClass(
    class WARPSwitcherPrefsWidget extends Gtk.Box {

        _init(params) {

            super._init(params);

            this.margin = 20;
            this.set_spacing(15);
            this.set_orientation(Gtk.Orientation.VERTICAL);

            const settings = ExtensionUtils.getSettings(schema);

            if (Gtk.main_quit)
                this.connect('destroy', Gtk.main_quit);

            let fieldStatusCheckFreqLabel = new Gtk.Label({
                label : 'Status Check Frequency (in seconds)'
            });

            let fieldStatusCheckFreq = new Gtk.SpinButton({
                adjustment: new Gtk.Adjustment({
                    value: 10,
                    lower: 1,
                    upper: 3600,
                    step_increment: 1
                })
            });

            settings.bind(
                'status-check-freq',
                fieldStatusCheckFreq,
                'value',
                Gio.SettingsBindFlags.DEFAULT
            );

            let hBox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 20
            });


            if (hBox.pack_start) {
                fieldStatusCheckFreqLabel.set_xalign(0);

                hBox.pack_start(fieldStatusCheckFreqLabel, true, true, 0);
                hBox.pack_end(fieldStatusCheckFreq, false, false, 0);

                this.add(hBox);
            }
            else {
                hBox.set_halign(Gtk.Align.FILL);
                fieldStatusCheckFreqLabel.set_hexpand(true);
                fieldStatusCheckFreqLabel.set_halign(Gtk.Align.START);
                fieldStatusCheckFreq.set_hexpand(false);
                fieldStatusCheckFreq.set_halign(Gtk.Align.END);

                hBox.prepend(fieldStatusCheckFreqLabel);
                hBox.append(fieldStatusCheckFreq);

                this.prepend(hBox);
            }

        }

    });

