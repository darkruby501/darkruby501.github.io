darkruby501.github.io
=====================
Javascript Photoplethysmogram Webcam Pulse Detector

<Insert Copyright Info (Ruben Bloom, 2014 + others)>

Based on https://github.com/thearn/webcam-pulse-detector

Uses:  
- https://github.com/auduno/headtrackr/
- https://github.com/corbanbrook/dsp.js/
- http://g.raphaeljs.com/
- https://github.com/joewalnes/smoothie/


To-Do:
- Debug operation in Mozilla Firefox.
- Fix hardcoding of canvas sizes.
- Potentially use only facedetection algorithm and no headtracking.
- Use rotated head capture for forehead.
- Refine FFT (windowing, etc.)
- Apply smoothing to output? WMA?
- Tidy variables.

Potential Ways to Boost Accuracy:
- Windowing on FFT
- Filtering of Pulse Wave (band pass?).
- Smoothing of Output (discard outliers)
- Button to flush buffer
- Automatically flush buffer when large movement detected
- Green background!
