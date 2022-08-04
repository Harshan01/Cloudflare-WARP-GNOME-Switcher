# Unofficial Cloudflare 1.1.1.1 WARP Switcher for GNOME shell

Adds a top panel indicator for Cloudflare 1.1.1.1 WARP using GNOME extension.

### Samples

Disconnected

![./samples/disconnected.png](./samples/disconnected.png)

Connected

![./samples/connected.png](./samples/connected.png)

### Prerequisites

This extension needs `warp-cli` installed and registered. If not, follow the steps below:
* Install `warp-cli` by following steps from [1.1.1.1 for Linux page](https://developers.cloudflare.com/warp-client/get-started/linux/).
* Run `warp-cli register` on terminal to use the WARP service on official cloudflare servers.

### Installation

#### Using GNOME Extensions (recommended)
Extension page link: [https://extensions.gnome.org/extension/4670/cloudflare-1111-warp-switcher/](https://extensions.gnome.org/extension/4670/cloudflare-1111-warp-switcher/)

#### Manual Installation
Download the extension package by cloning this repository, or downloading and extracting zip.

```console
$ git clone https://github.com/Harshan01/Cloudflare-WARP-GNOME-Switcher.git
```

Core extension folder in this downloaded repo needs to be moved to the extensions directory used by GNOME. `install.sh` is a simple script which will help you do it.

```console
$ sh ./install.sh
```

The GNOME shell may sometimes need to be restarted for the extension to get recognized. Press `Alt+F2` and type `r` in the textbox to refresh the shell. Alternately, you can simply logout and log back in.

Finlly, activate `Cloudflare 1.1.1.1 WARP Switcher` from GNOME Extensions app, or from the terminal using following command.

```console
$ gnome-extensions enable cloudflare-warp-gnome@harshan01
```

That's it!
