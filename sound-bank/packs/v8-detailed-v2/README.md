# V8 Detailed v2 — 48 kHz Stereo Sound Library

A reusable sound pack for current and future games, independent of REDLINE or Streetbound. The pack contains **85 actual ZIP-archived WAV files** (72 RPM engine stems and 13 induction/event sounds). The older V8 Performance v1 audio is unchanged.

## Engine banks

| Engine character | RPM anchors | Audio |
|---|---|---|
| Cammed pushrod V8 (v8_ls_race_cam) | 950, 1400, 2300, 3700, 5400, 6800 | 3 load layers × cabin/exterior |
| High-rev DOHC V8 (v8_coyote_dohc) | 900, 1500, 2600, 4300, 6200, 7800 | 3 load layers × cabin/exterior |

Every engine anchor contains separate power exhaust, coast exhaust and intake stems in both perspectives, rendered at **48 kHz, stereo, 16-bit signed PCM**. Loop RPMs and source paths are in manifest.json. The sounds use a multi-cycle firing model, differentiated cross-plane harmonic balance and cam lope concentrated near idle. The cabin perspective is an original acoustic approximation, not a recorded impulse response.

**The higher sample rate does not mean these match real engine recordings.** These are original synthesized audio assets suitable for game sound-design iteration, not authenticated OEM or aftermarket exhaust captures.

## Boost and events

13 additional WAVs are included: single/twin-turbo spool, Roots/twin-screw/centrifugal whine, compressor air, wastegate, atmospheric/recirculated BOV, light/heavy flutter, blower bypass, and an overrun pop. Use manifest loop flags to distinguish continuous layers from events. Gate BOV and flutter to actual boost, throttle closure and shifts.

## Install into any Godot 4 game

From a toolkit checkout:

~~~sh
python sound-bank/install_detailed_v8.py --out /path/to/GAME/assets/audio/v8_detail_v2
~~~

Install only one engine while retaining the effects:

~~~sh
python sound-bank/install_detailed_v8.py --out /path/to/GAME/assets/audio/v8_detail_v2 --engine v8_ls_race_cam
~~~

Options: --dry-run (CRC/header/conflict validation without writing), --without-effects (omit boost/FX samples), --overwrite (explicitly replace changed files). Repeated compatible installs are safe. The installer never overwrites the old 22 kHz sound-bank index.

## Godot usage

Copy godot/audio/detailed_v8_bank.gd and godot/audio/detailed_v8_player.gd into the game. Keep WAV files at res://assets/audio/v8_detail_v2. For example:

~~~gdscript
var sound := GDTDetailedV8Player.new()
add_child(sound)
sound.configure("v8_ls_race_cam", "exterior", "twin_turbo")
sound.release_sound = "flutter_hard"
sound.set_drive_state(3700.0, 0.85, 0.80, 12.0)
sound.notify_shift()
~~~

The player uses a bounded voice pool, engine-load crossfades between two adjacent RPM regions, optional interior/exterior rendering, and turbo/blower layers that follow boost or RPM. It is non-positional; use a game-specific 2D/3D adapter for world spatialization. Actual perceived quality must be assessed in each game and platform. No game files are changed by adding these assets to the toolkit.

## Rebuild and validate

~~~sh
node sound-bank/packs/v8-detailed-v2/build_archives.mjs
node --test sound-bank/packs/v8-detailed-v2/tests/*.test.mjs
python -m unittest discover -s sound-bank/tests -v
~~~

All WAV files and the source renderer are original toolkit-authored material, not downloaded from videos or commercial sample packs. Any future field recordings must have licenses permitting **redistribution in a standalone sound bank**, with individual provenance records and attribution.
