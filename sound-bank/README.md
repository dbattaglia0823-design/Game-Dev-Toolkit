# Vehicle Sound Bank — Phase 1

An expandable **Godot 4 vehicle sound bank** using REDLINE's RPM-layer format and Streetbound's per-car sound design. The initial catalog covers **118 vehicle profiles** (30 from REDLINE and 88 from Streetbound), **27 engine families** and interchangeable sound modifications. Profiles are acoustic design estimates, **not authenticated OEM recordings**.

## Files

- **catalog.json:** 118 uniquely prefixed vehicle profiles, 27 families, provenance and sound-design parameters.
- **modifiers.json:** four camshaft stages; stock, cat-back, headers, straight-pipe and valved exhausts; four intakes; naturally aspirated, single/twin/twin-scroll turbo and three supercharger types; boost and release-sound presets.
- **build_bank.py:** dependency-free, offline engine-stem renderer and optional REDLINE sample importer.
- **previews/:** original synthesized audio previews for several engine types and modifications. Preview WAVs are not real-world recordings.
- **../godot/audio/vehicle_sound_bank.gd:** resolves models, mod choices, two neighboring RPM bands, exhaust/coast/intake/mechanical layers, texture loops and release/shift events.

## Generate a usable Godot audio bank

From the toolkit root, run:

~~~sh
python sound-bank/build_bank.py --out /path/to/GAME/assets/audio/vehicle_bank
~~~

The default outputs five engine families: i4_turbo, i6_turbo, v8_cross, v8_super, and v10_na. Each has four RPM bands (900, 1800, 3600 and 6200) and five layers at each anchor: exhaust_on, exhaust_off, intake_on, intake_off and mechanical. It also exports **nine additional texture loops and nine one-shot effects**: BOV variants, flutter, wastegate, bypass, ignition/starter, limiter, shift cut and exhaust pop. All clips are 16-bit mono WAV at 22.05 kHz.

For wider coverage, add **--all-families**, or select repeatable **--family v6_tt** flags. Other options include **--rpm 850 --rpm 2500 --rpm 4800** for new anchors, **--cam-lope 0.65** for more uneven cammed idle and **--exhaust 0.8** for a more aggressive rendered source. These are rendered sound-design variations; real cam lope depends on cylinder dynamics and requires properly sourced recordings for exact matches.

## Import the existing REDLINE sounds (recommended)

REDLINE currently has original **synthesized**, not recorded, sounds for 18 engine families and 30 individually designed vehicle banks. Its source banks provide 14 RPM anchors with five layers. When available locally, import them without resampling:

~~~sh
python sound-bank/build_bank.py \
  --out /path/to/GAME/assets/audio/vehicle_bank \
  --redline-dir /path/to/Redline \
  --redline-vehicle mustang \
  --redline-family v8_cross \
  --family v8_cross
~~~

Repeat **--redline-vehicle** and **--redline-family** to import more. Imported WAVs are copied byte-for-byte, file paths are remapped to the new Godot root, and the bank index identifies their REDLINE origin. It requires a local REDLINE checkout containing the WAV assets, not just this small toolkit repository. Copying all assets would substantially increase repository size, so **the full REDLINE audio collection is intentionally not duplicated** here.

## Runtime usage (Godot 4)

Copy **godot/audio/vehicle_sound_bank.gd** to a game script directory. Place generated content at **res://assets/audio/vehicle_bank/**.

~~~gdscript
var bank = GDTVehicleSoundBank.index()
var voice = GDTVehicleSoundBank.profile("redline:mustang", {
    "cam": "race",
    "exhaust": "straight_pipe",
    "induction": "single_turbo",
    "boost": "high",
    "turbo_release": "compressor_flutter"
})
var layers = GDTVehicleSoundBank.mix_recipe(voice, 3400.0, 0.86, bank)
# Assign each stream to a cached AudioStreamPlayer. Apply gain/pitch each frame,
# smoothing volume targets to avoid discontinuities; use bounded voice pooling.
var flutter = GDTVehicleSoundBank.event_stream(voice, "boost_release", bank)
var exhaust_bed = GDTVehicleSoundBank.texture_stream(voice, "exhaust", bank)
~~~

The adapter is a **data and mix recipe**, not a full vehicle audio controller. It does not automatically patch either game or supply a ready-wired car scene. In a driving controller, maintain a small cached pool of AudioStreamPlayer nodes, smooth gains and pitch, crossfade neighboring bands, synchronize on/off layers to actual throttle/load, and gate boost release by real boost and throttle/shift events. Do not call JSON parsing or un-cached ResourceLoader operations on every audio frame. The toolkit's sound choices never change performance physics.

## Licensing and sources

The only checked-in audio is original synthesized material: the first 16 previews and the Phase 2 V8 WAV archives. **No third-party audio clips have been imported**. Prior REDLINE research considered online Freesound candidates, but recordings were not downloaded or cleared for inclusion. Before adding a recorded clip to a publicly distributable sound library, record its author, original source URL, exact license, redistribution rights, recording/model identification and any attribution requirement. A vehicle name or a public video does not confer permission to redistribute its audio.

In particular, **Sonniss's GDC Bundle license (v2, effective August 27, 2026)** permits audio used in finished games but **forbids redistributing the sound effects as a sound library, asset pack, sample pack or SDK**, including modified sounds. Do not put those assets into this toolkit.

References:
- REDLINE source: https://github.com/dbattaglia0823-design/Redline
- Streetbound source: https://github.com/dbattaglia0823-design/Streetbound
- Sonniss current license: https://sonniss.com/gdc-bundle-license/
- Freesound candidates (review individual clip licenses): https://freesound.org/search/?q=car%20engine
- Godot audio buses: https://docs.godotengine.org/en/stable/tutorials/audio/audio_buses.html

## Validation

~~~sh
python -m unittest discover -s sound-bank/tests -v
~~~

Python tests check source coverage, generated PCM headers, anchor data and effect availability. Godot compile, actual playback and per-car perceptual quality must still be validated inside each target game. Further passes can cover additional standalone sound packs, more cars, stereo exterior/interior, custom exhaust microphone positions, starter/shutdown recordings, more rotor/diesel/EV variants and licensed field-recording imports.

## Phase 2 — Permanently stored V8 performance WAVs

The [V8 Performance Sound Pack](packs/v8-performance-v1/README.md) now stores **162 actual original synthesized WAV assets** in 13 versioned ZIP archives (12 engine families with 4 RPM bands and 3 layers each, plus 18 sounds for turbo, supercharger, cam/exhaust and engine events). These archives stay in GitHub for use by any current or future game.

Use **python sound-bank/install_pack.py --out /path/to/GAME/assets/audio/vehicle_bank** to extract all WAVs and merge the existing bank and catalog. For selected banks, pass repeated **--engine** flags. Python verifies archive CRCs, expected file names, WAV formats and collision safety before writing. No live dependency on REDLINE or Streetbound is needed to use the V8 pack.

Two portable scripts, **godot/audio/vehicle_sound_bank.gd** and **godot/audio/vehicle_sound_player.gd**, support family selection, load/coast crossfades, effects and explicit sound-family overrides. The original synthesized engine files do not replace independently recorded car audio. No third-party recordings were added.
