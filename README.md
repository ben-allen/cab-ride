# Cab Ride

A focus companion: a front-window train video with a live route map beside it.
The map reads the video's playback time, so pausing, scrubbing and skipping stay in sync.

## Files

- `index.html`: the page
- `style.css`: styles
- `app.js`: player and map logic
- `routes.js`: route data (stations, stop times, map shape, video)

## Publish on GitHub Pages

1. Put these files at the root of a repository (or in a `docs/` folder).
2. In the repo, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick your branch and folder (`/ (root)` or `/docs`), and save.
4. The site appears at `https://<username>.github.io/<repo>/` after a minute or two.

## Try it locally first

YouTube's player won't load from a double-clicked file. Serve the folder instead:

```
cd path/to/this/folder
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Using it

- **F** toggles full screen. **Space** plays and pauses (when the page, not the video, has focus).
- **Adjust timing** at the bottom of the side panel:
  - *Map offset* shifts the whole map earlier or later if it's consistently off.
  - *Set arrival here* / *Set departure here* fix a single stop using the video's current position.
  - Adjustments are saved in your browser. *Restore original times* undoes them.

## Adding a route

Add another entry to `window.ROUTES` in `routes.js` with its own key, then open `…/#<key>`.
The first route in the file is the default. Each station needs `arr` and `dep` in seconds
(the last station's `dep` is `null`). The `shape` coordinates are optional; without them
the map is drawn as a straight strip.
