// WARP Switcher

'use strict';

const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Atk = imports.gi.Atk;
const Config = imports.misc.config;

const Gettext = imports.gettext.domain('gnome-shell-extension-cloudflare-warp-switcher');
const _ = Gettext.gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();

const IndicatorName = "Cloudflare 1.1.1.1 WARP Switcher";
const DisabledIconName = 'warp-off-icon';
const EnabledIconName = 'warp-on-icon';

let WARPSwitcherIndicator;
let icon, EnabledIcon, DisabledIcon;

const WARPSwitcher = GObject.registerClass(
class WARPSwitcher extends PanelMenu.Button {
    _init() {
        super._init(null, IndicatorName);

        this.accessible_role = Atk.Role.TOGGLE_BUTTON;

        EnabledIcon = Gio.icon_new_for_string(`${Me.path}/icons/${EnabledIconName}.svg`)
        DisabledIcon = Gio.icon_new_for_string(`${Me.path}/icons/${DisabledIconName}.svg`)

        icon = new St.Icon({
            gicon : DisabledIcon,
            style_class : 'system-status-icon',
        });

        if (this._getWARPStatus()) {
            this._state = true;
            icon.gicon = EnabledIcon;
        }
        else {
            this._state = false;
            icon.gicon = DisabledIcon;
        }
        this.add_child(icon);

        this.add_style_class_name('panel-status-button');
        this.connect('button-press-event', this.toggleState.bind(this));
        this.connect('touch-event', this.toggleState.bind(this));
    }

    _getWARPStatus() {
        // Check if "warp-cli status" is "Connected" or not
        try {
            let proc = Gio.Subprocess.new(
                ['warp-cli', 'status'],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );

            let [ok, stdout, stderr] = proc.communicate_utf8(null, null);
            if (ok) {
                return this._parseWARPStatus(stdout);
            } else {
                logError(stderr);
            }
        } catch (e) {
            logError(e);
        }
        
        return false;
    }

    toggleState() {
        this._state = this._getWARPStatus();
        log(this._state);
        if (this._state) {
            // On -> Off
            // Run "warp-cli disconnect" and listen for status
            this._runWARPCLICommand('disconnect');
            if (!this._getWARPStatus()) {
                this._state = false;
                // this.remove_child(icon);
                icon.gicon = DisabledIcon;
                // this.add_child(icon);
                this._sendNotification();
            }
        }
        else {
            // Off -> On
            // Run "warp-cli connect" and listen for status
            this._runWARPCLICommand('connect');
            if (this._getWARPStatus()) {
                this._state = true;
                // this.remove_child(icon);
                icon.gicon = EnabledIcon;
                // this.add_child(icon);
                this._sendNotification();
            }
        }
    }

    _parseWARPStatus(stdout) {
        // Parse output of "warp-cli status" command
        if (stdout.includes("Connected") || stdout.includes("Connecting"))
            return true;
        else
            return false;
    }

    _runWARPCLICommand(command) {
        try {
            let proc = Gio.Subprocess.new(
                ['warp-cli', command],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );
        } catch (e) {
            logError(e);
        }
    }

    _sendNotification() {
        if (this._state == true) {
            Main.notify(_('Cloudflare 1.1.1.1 WARP Connected'));
        } else {
            Main.notify(_('Cloudflare 1.1.1.1 WARP Disconnected'));
        }
    }

    destroy() {
        super.destroy();
    }
});


function init() {
    // Check if warp-cli is installed and if "warp-cli status" is "success"
    try {
        let proc = Gio.Subprocess.new(
            ['which', 'warp-cli'],
            Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
        );

        let [ok, stdout, stderr] = proc.communicate_utf8(null, null);
        if (ok) {
            log(stdout);
            if (stdout == 'warp-cli not found')
                Main.notify(_('warp-cli is not installed!'));
        } else {
            logError(stderr);
            throw new Error(stderr);
        }
    } catch (e) {
        logError(e);
    }
}

function enable() {
    WARPSwitcherIndicator = new WARPSwitcher()
    Main.panel.addToStatusArea(IndicatorName, WARPSwitcherIndicator);
}

function disable() {
    WARPSwitcherIndicator.destroy();
    WARPSwitcherIndicator = null;
}