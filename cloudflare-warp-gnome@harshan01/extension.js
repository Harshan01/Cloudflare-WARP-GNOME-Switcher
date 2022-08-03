'use strict';

const GLib = imports.gi.GLib;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Atk = imports.gi.Atk;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const Gettext = imports.gettext.domain('gnome-shell-extension-cloudflare-warp-switcher');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const schema = Me.metadata['settings-schema'];

const IndicatorName = 'Cloudflare 1.1.1.1 WARP Switcher';
const DisconnectedIconName = 'warp-off-icon';
const ConnectedIconName = 'warp-on-icon';

let WARPSwitcherIndicator;
let icon, ConnectedIcon, DisconnectedIcon;

const ConnStates = {
    DISCONNECTED: 0,
    CONNECTED: 1,
    CONNECTING: 2,
    UNKNOWN: 3
};

const WARPSwitcher = GObject.registerClass(
    class WARPSwitcher extends PanelMenu.Button {
        _init() {
            super._init(null, IndicatorName);

            this.settings = ExtensionUtils.getSettings(schema);

            this.settingsChangedId = this.settings.connect('changed', this._onSettingsChange.bind(this));

            this.statusCheckFreq = this.settings.get_uint('status-check-freq');

            this.accessible_role = Atk.Role.TOGGLE_BUTTON;

            ConnectedIcon = Gio.icon_new_for_string(`${Me.path}/icons/${ConnectedIconName}.svg`);
            DisconnectedIcon = Gio.icon_new_for_string(`${Me.path}/icons/${DisconnectedIconName}.svg`);

            icon = new St.Icon({
                gicon : DisconnectedIcon,
                style_class : 'system-status-icon',
            });

            if (this._getWARPStatus()) {
                this._state = ConnStates.CONNECTED;
                icon.gicon = ConnectedIcon;
            }
            else {
                this._state = ConnStates.DISCONNECTED;
                icon.gicon = DisconnectedIcon;
            }
            this.add_child(icon);

            log('Status Check Frequency: ' + this.statusCheckFreq);
            this._setStatusCheckTimeout(this.statusCheckFreq);

            this.add_style_class_name('panel-status-button');
            this.connect('button-press-event', this.toggleState.bind(this));
            this.connect('touch-event', this.toggleState.bind(this));
        }

        _setStatusCheckTimeout(timeout_s) {
            log('Status Check Frequency changed to ' + timeout_s);
            this.timeout = GLib.timeout_add_seconds(
                GLib.PRIORITY_DEFAULT,
                timeout_s,
                () => {
                    this.updateState(false);
                    return GLib.SOURCE_CONTINUE;
                });
        }

        _onSettingsChange() {
            log('Settings changed');
            let newStatusCheckFreq = this.settings.get_uint('status-check-freq');
            log(this.statusCheckFreq + ' to ' + newStatusCheckFreq);
            if ((this.statusCheckFreq !== newStatusCheckFreq) && this.timeout) {
                GLib.Source.remove(this.timeout);
                this.statusCheckFreq = newStatusCheckFreq;
                this._setStatusCheckTimeout(this.statusCheckFreq);
            }
        }

        _parseWARPStatus(stdout) {
            // Parse output of "warp-cli status" command
            if (stdout.includes('Connected'))
                return ConnStates.CONNECTED;
            if (stdout.includes('Connecting'))
                return ConnStates.CONNECTING;
            if (stdout.includes('Disconnect'))
                return ConnStates.DISCONNECTED;
            return ConnStates.UNKNOWN;
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

            return ConnStates.UNKNOWN;
        }

        _runWARPCLICommand(command) {
            try {
                Gio.Subprocess.new(
                    ['warp-cli', command],
                    Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
                );
            } catch (e) {
                logError(e);
            }
        }

        updateState(notify) {
            this._state = this._getWARPStatus();
            log('State: ' + this._state + ', Notify: ' + notify);
            if (this._state === ConnStates.CONNECTED) {
                icon.gicon = ConnectedIcon;
                if (notify) Main.notify('Cloudflare 1.1.1.1 WARP Connected');
            }
            else if (this._state === ConnStates.CONNECTING) {
                icon.gicon = ConnectedIcon; // different icon for CONNECTING state?
                if (notify) Main.notify('Cloudflare 1.1.1.1 WARP Connecting');
            }
            else if (this._state === ConnStates.DISCONNECTED) {
                icon.gicon = DisconnectedIcon;
                if (notify) Main.notify('Cloudflare 1.1.1.1 WARP Disconnected');
            }
            else {
                icon.gicon = DisconnectedIcon; // different icon for UNKNOWN state?
                if (notify) Main.notify('Cloudflare 1.1.1.1 WARP in unknown state! Try toggling WARP after sometime or try reloading the extension!');
            }
        }

        toggleState() {
            this._state = this._getWARPStatus();
            log('Toggling from State: ' + this._state);
            if (this._state === ConnStates.CONNECTED || this._state === ConnStates.CONNECTING) {
                // On -> Off
                // Run "warp-cli disconnect"
                this._runWARPCLICommand('disconnect');
            }
            else { // attempt to connect even in UNKNOWN state
                // Off -> On
                // Run "warp-cli connect"
                this._runWARPCLICommand('connect');
            }
            this.updateState(true);
        }

        destroy() {
            if (this.settingsChangedId) {
                this.settings.disconnect(this._settingsChangedId);
                this.settingsChangedId = null;
            }

            if (this.timeout) {
                GLib.Source.remove(this.timeout);
                this.timeout = null;
            }

            super.destroy();
        }
    });

// eslint-disable-next-line no-unused-vars
function init() {
    log('Extension initialized');
}

// eslint-disable-next-line no-unused-vars
function enable() {
    // Check if warp-cli is installed and if "warp-cli status" is "success"
    try {
        let proc = Gio.Subprocess.new(
            ['which', 'warp-cli'],
            Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
        );

        let [ok, stdout, stderr] = proc.communicate_utf8(null, null);
        if (ok) {
            log('warp-cli path: ' + stdout);
            if (stdout.includes('warp-cli not found'))
                Main.notify(_('warp-cli is not installed! Install warp-cli and register with official cloudflare servers to proceed.'));
        } else {
            logError(stderr);
            throw new Error(stderr);
        }
        WARPSwitcherIndicator = new WARPSwitcher();
        Main.panel.addToStatusArea(IndicatorName, WARPSwitcherIndicator);
    } catch (e) {
        logError(e);
    }
}

// eslint-disable-next-line no-unused-vars
function disable() {
    WARPSwitcherIndicator.destroy();
    WARPSwitcherIndicator = null;
}

