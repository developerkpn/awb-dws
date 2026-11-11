# WB.NET reference machine (RDP)

A Windows machine with the existing weighbridge application **WB System** (WB.NET, V.2.37.8.0) is open in the Administrator session. Use it to collect screenshots and walkthroughs for the menu parity list in `docs/project-files/supporting/wbnet-menu-parity.csv`.

| Item     | Value                                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Host     | `172.30.1.98:3389` (office network)                                                                                                      |
| Account  | `.\administrator` (local account, no domain)                                                                                             |
| Password | `docs/wbnet/.env.rdp` on Ben's machine (git-ignored); otherwise ask Ben                                                                  |
| App      | WB System, PT ENERGI UNGGUL PERSADA, Loc K1, signed in as `ADMIN`                                                                        |
| Menus    | Registrasi, Penimbangan, Fitur, Data Master, Konfigurasi, Laporan, Upload To SAP, Ganti Profil, Keluar, Tutup Program, Sinkronisasi Data |

The data looks real (current dates, plates and DO numbers). Treat it as a live system:

- Only open menus and screens and read them.
- Do not press **Upload To SAP**, **Sinkronisasi Data**, or any save/delete button in Data Master or Konfigurasi.
- Do not use **Keluar** or **Tutup Program**, and do not sign out of Windows. Disconnect instead, so the app stays open in the session.

This machine is a test copy. Its SAP connection points to SAP dev (`erpdev-gm`, system GMD, client 130). Creating, editing and deleting inside the app is allowed. Do not run Upload To SAP, Sinkronisasi Data, token requests (they e-mail the recipients) or printing.

[menu-map.md](menu-map.md) maps every menu and screen, the BEL flow tested on 2026-11-10, and how each screen relates to the development timeline. It also lists the test data that run left behind. The screenshots it refers to are only on the machine that took them.

## Password file

`docs/wbnet/.env.rdp` holds one line and is ignored by `.env.*` in `.gitignore`:

```sh
RDP_PASS='...'
```

## Desktop client

```sh
xfreerdp /v:172.30.1.98 /u:administrator /d:. /cert:ignore /size:1600x900
```

Remmina or Microsoft Remote Desktop work the same way. Windows still shows its own login screen after connecting; type the password there.

## Headless client with screenshots

This runs the RDP client on a virtual display inside a container, so nothing opens on the desktop. Screenshots land in `docs/wbnet/shots/` (git-ignored).

```sh
cd docs/wbnet
podman build -t rdp-headless -f - . <<'EOF'
FROM registry.fedoraproject.org/fedora:42
RUN dnf -y install --setopt=install_weak_deps=False freerdp xorg-x11-server-Xvfb xdotool ImageMagick procps-ng && dnf clean all
EOF

mkdir -p shots
. ./.env.rdp
podman run -d --name rdp -v "$PWD/shots:/shots:Z" rdp-headless sleep infinity
podman exec -d rdp sh -c 'Xvfb :1 -screen 0 1600x900x24 -nolisten tcp'
podman exec -d -e DISPLAY=:1 -e RDP_PASS rdp sh -c \
  'xfreerdp /v:172.30.1.98 /u:administrator /d:. /p:"$RDP_PASS" /cert:ignore /size:1600x900 -wallpaper /log-level:WARN >/tmp/rdp.log 2>&1'
```

Common steps:

```sh
# screenshot
podman exec -e DISPLAY=:1 rdp import -window root /shots/01.png

# Windows login screen: click the password field, type, Enter
podman exec -e DISPLAY=:1 -e RDP_PASS rdp sh -c \
  'xdotool mousemove 785 534 click 1; sleep 0.5; xdotool type --delay 80 "$RDP_PASS"; xdotool key Return'

# click, type, keys
podman exec -e DISPLAY=:1 rdp xdotool mousemove 40 34 click 1
podman exec -e DISPLAY=:1 rdp xdotool type --delay 50 'text'
podman exec -e DISPLAY=:1 rdp xdotool key Escape

# disconnect (the Windows session and the app keep running)
podman rm -f rdp
```

The client log is at `/tmp/rdp.log` inside the container. Kerberos and keyboard-map warnings in it are harmless; the connection falls back to NTLM.
