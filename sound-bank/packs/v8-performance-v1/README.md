# V8 Performance Sound Pack v1

This is a **portable sound library for current or future Godot games**. It contains real WAV files, saved in 13 GitHub ZIP archives: **12 engine signatures × 4 RPM anchors × 3 sound layers = 144 engine stems**, plus **18 effect stems** (162 WAV files total).

These WAVs are **original procedural approximations**, not factory recordings of real vehicles. They can be used as game assets, extended or replaced with independently cleared field recordings.

## Engine sound banks

| Engine | Sound characteristics | RPM anchors |
|---|---|---|
| v8_smallblock_ohv | Classic American small-block rumble | 750, 1650, 3400, 6200 |
| v8_bigblock_ohv | Large-displacement low burble | 650, 1400, 2800, 5200 |
| v8_ls_ohv | Modern pushrod V8 | 750, 1700, 3500, 6800 |
| v8_coyote_dohc | High-rev DOHC muscle V8 | 900, 1900, 4200, 7600 |
| v8_hemi | Deep large-displacement V8 | 700, 1600, 3400, 6500 |
| v8_euro_cross | Bright, higher-rev cross-plane V8 | 850, 1900, 4300, 7800 |
| v8_flat_plane | High-pitched flat-plane V8 | 950, 2200, 5100, 8800 |
| v8_roots_blown | Roots/twin-screw blower V8 | 800, 1900, 3800, 7000 |
| v8_twin_turbo | Twin-turbo V8 core | 850, 2100, 3900, 7200 |
| v8_ls_street_cam | Mild/street cam across the RPM range | 800, 1750, 3500, 6700 |
| v8_ls_race_cam | Aggressive cammed idle and RPM | 1050, 2050, 3900, 6900 |
| v8_ls_straight_pipe | Open-exhaust V8 throughout the rev range | 800, 1700, 3600, 6900 |

Each engine bank has on-throttle exhaust, off-throttle exhaust and intake stems at each anchor. The game runtime pitches and crossfades between RPM regions.

**Effects:** single/twin-turbo spool, Roots/twin-screw/centrifugal whine, intake suction, exhaust burble, single/double exhaust pop, recirculated/vented blow-off, compressor flutter, external wastegate, blower bypass, ignition, shift cut, rev limiter and shutdown.

## Install in any Godot 4 game

From the root of a Game-Dev-Toolkit checkout, run:

~~~sh
python sound-bank/install_pack.py --out /path/to/GAME/assets/audio/vehicle_bank
~~~

This extracts all 162 WAVs and creates or merges the bank, catalog and modifier JSON indexes. Install just the V8 banks you need:

~~~sh
python sound-bank/install_pack.py \
  --out /path/to/Redline/assets/audio/vehicle_bank \
  --engine v8_coyote_dohc \
  --engine v8_roots_blown \
  --engine v8_ls_race_cam
~~~

Use --dry-run to validate archive members, CRC, PCM headers and file conflicts without writes. Use --without-effects to omit the 18 effects. Existing bank entries and audio files are preserved unless --overwrite is explicitly selected.

**Do not overwrite REDLINE's existing assets/audio/engines folder.** The portable bank goes in assets/audio/vehicle_bank, separately from its original systems.

## Godot playback

Copy both scripts into the target game's script paths:

- godot/audio/vehicle_sound_bank.gd: profiles, family overrides and bank lookup
- godot/audio/vehicle_sound_player.gd: cached RPM mixing and boost/shift effects

Example for an independently reusable engine:

~~~gdscript
var sound_player := GDTVehicleSoundPlayer.new()
sound_player.initial_vehicle_id = ""
add_child(sound_player)
sound_player.equip_vehicle("toolkit:v8_ls_race_cam", {
    "exhaust": "straight_pipe",
    "induction": "single_turbo",
    "turbo_release": "compressor_flutter"
})
sound_player.set_drive_state(3200.0, 0.86, 0.74, 8.5, true)
sound_player.notify_shift()
~~~

A game already using REDLINE or Streetbound's catalog can retain its existing cars and select one of the portable engine audio families:

~~~gdscript
sound_player.equip_vehicle("redline:mustang", {
    "sound_family": "v8_coyote_dohc",
    "exhaust": "catback"
})
~~~

Example starting family matches for later game integration: redline:camaro to v8_ls_ohv, redline:gt500 to v8_roots_blown, redline:z06 to v8_flat_plane. These are acoustically motivated presets, not authenticated trim-specific recordings.

The reusable player is **non-positional**; adapt AudioStreamPlayer to AudioStreamPlayer2D or AudioStreamPlayer3D for positional world audio. interior_view currently adjusts only attenuation; it does not implement cabin low-pass filtering or reverb. Keep boost release and pops linked to real in-game state rather than random unconditional playback.

## Rebuild and test the archive

These 13 ZIPs are source-controlled sound assets, not references to missing recordings. A Node 20+ source generator is included:

~~~sh
node sound-bank/packs/v8-performance-v1/build_archives.mjs
python -m unittest discover -s sound-bank/tests -v
node --test sound-bank/packs/v8-performance-v1/tests/*.test.mjs
~~~

The source files are render.mjs (engine and effects wave synthesis), archive.mjs (ZIP writer), pack.json (asset provenance and RPM definitions), bank.json (runtime paths), and catalog-extension.json (12 independently usable profiles). Asset names are stable so future versions can add new vehicles without breaking existing games.

## Recording provenance

No online engine recordings were downloaded or copied into these sound banks. To add a real clip, verify that the specific file's license permits repackaging in a **redistributable audio library**, and record its author, source URL, exact license and attribution obligations. The current Sonniss GDC license does **not** allow republishing sound effects as a separate SDK, asset pack or sound library; see https://sonniss.com/gdc-bundle-license/.
