# Reusable V8 Audio Asset Library

This directory contains **actual standalone WAV files**, not merely synthesis parameters. Each can be copied into any game. The asset pack is independent of REDLINE and Streetbound and is designed as a shared library for future projects.

## What is included

- Four distinct synthesized engine characters: cross-plane V8 stock, cross-plane street cam, cross-plane race cam, and flat-plane V8.
- For each engine character: idle and high RPM regions, each with independently recorded-style synthesized power and off-throttle coast loops (16 WAV engine loops total).
- Eight additional additive exhaust WAV loops at idle/high RPM, covering stock, cat-back, headers and straight-pipe. Keep these under the main engine layer, not instead of it.
- 14 effect assets: single-turbo spool, twin-turbo spool, Roots whine, twin-screw whine, centrifugal whine, atmospheric BOV, recirculating BOV, turbo flutter, external wastegate, supercharger bypass, exhaust pop, shift cut, starter, shutdown.
- Asset paths, pitch anchor RPM, duration and loop/event flags are in [manifest.json](manifest.json).

These are **original synthesized approximations**. They are *not* microphone recordings of modified cars or OEM samples. The higher-quality REDLINE 14-anchor stems remain accessible through the original importer; do not describe this pack as measured or recorded automobile sound.

## Use in any game

Copy `library/v8/` into your game's assets folder, preserving relative paths. Read `manifest.json`. For RPM engine loops, select the variant and the two adjacent RPM regions, pitch each stream by `current_rpm / actual_rpm`, equal-power crossfade across the two anchors, and interpolate coast/power by actual engine load. Use engine load rather than raw throttle for realistic shifts and deceleration. Create dedicated playing sources for each active layer and maintain crossfades on car changes.

Effects can be used independently. Trigger BOV/flutter **only** when an installed turbo compressor has boost and the throttle closes or a shift occurs. Roots, twin-screw, and centrifugal whine should respond to RPM, drive ratio and boost/load. Supercharger bypass is different from turbo venting. Exhaust pops should be sparse and tied to overrun/tune parameters. No audio setting changes horsepower.

For Godot 4, copy [v8_asset_library.gd](../../../godot/audio/v8_asset_library.gd) and the entire V8 asset directory to `res://assets/audio/v8`. Call `GDTV8AssetLibrary.engine_mix("cross_race_cam", rpm, engine_load)`, `GDTV8AssetLibrary.exhaust_mix("straight_pipe", rpm)`, and `GDTV8AssetLibrary.effect("turbo_flutter")` on vehicle equip/audio events. Cache streams and ramp players rather than reload on every frame.

## Asset format and quality

- 16 kHz mono, 16-bit PCM WAV. These are compact, low-resolution first-pass production **candidates**, not high-fidelity microphone recordings.
- The engine files have repeating internal firing-period patterns and are intended for looping; verify loop seams and pitch transitions in the target engine. One-shot effects are not loopable unless marked `loop: true` in the manifest.
- The V8 bank includes no external recordings, so redistribution licensing does not depend on YouTube/Freesound/Sonniss assets.
- No work has been performed to copy or change either existing game.
- For higher quality later, build 44.1/48 kHz stereo assets, near/far and interior/exterior mic perspectives, more RPM anchors and measured vehicle-specific recordings with clearance.

## Next asset batches

1. Improved cross-plane V8 low/mid/full RPM layers across stock, cat-back, headers, straight pipe, valved and cam levels.
2. Separate turbo compressor/wastegate/intercooler and blower types with actual boost-dependent layers.
3. V6, inline-4, inline-6, boxer, V10, diesel, rotary and EV packs.
4. Real-world recordings with file-level verified redistribution licenses and attribution; do not import restricted sound-effect bundles into an asset library.
