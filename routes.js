// Route data for the cab-ride map.
// Each route needs a YouTube video id and a list of stations.
// Times are seconds into the video: arr = train stops, dep = train starts moving.
// `shape` is optional: [x, y, labelSide] per station in map units (labelSide: N, S, E, W, NE, NW, SE, SW).
// Without a shape, the map falls back to a straight strip.
window.ROUTES = {
  expo: {
    name: "Expo Line",
    subtitle: "Waterfront to King George",
    color: "#2f7be0",
    videoId: "Xx7EQuxmh7A",
    credit: "Video: DJ Hammers Transport",
    landmarks: [{ text: "SkyBridge", between: [15, 16], dy: 24 }],
    stations: [
      { name: "Waterfront",                arr:   43.2, dep:   66.0, shape: [ 146.1,  60.0, "N"]   },
      { name: "Burrard",                   arr:  134.8, dep:  160.8, shape: [ 100.0,  61.8, "W"]  },
      { name: "Granville",                 arr:  201.8, dep:  231.0, shape: [ 128.0,  92.7, "NE"]  },
      { name: "Stadium–Chinatown",         arr:  291.5, dep:  322.5, shape: [ 164.3, 122.4, "NE"]  },
      { name: "Main Street–Science World", arr:  412.2, dep:  449.0, shape: [ 207.3, 157.6, "NE"]  },
      { name: "Commercial–Broadway",       arr:  606.8, dep:  631.8, shape: [ 264.2, 193.8, "NE"]  },
      { name: "Nanaimo",                   arr:  747.8, dep:  773.0, shape: [ 304.5, 242.6, "NE"] },
      { name: "29th Avenue",               arr:  839.8, dep:  867.8, shape: [ 346.0, 276.8, "NE"] },
      { name: "Joyce–Collingwood",         arr:  953.5, dep:  984.8, shape: [ 393.9, 307.2, "NE"] },
      { name: "Patterson",                 arr: 1088.0, dep: 1114.0, shape: [ 443.8, 341.1, "NE"] },
      { name: "Metrotown",                 arr: 1184.5, dep: 1220.0, shape: [ 488.2, 370.9, "NE"] },
      { name: "Royal Oak",                 arr: 1315.2, dep: 1335.8, shape: [ 539.4, 398.4, "NE"] },
      { name: "Edmonds",                   arr: 1496.8, dep: 1521.8, shape: [ 601.0, 424.8, "NE"] },
      { name: "22nd Street",               arr: 1665.0, dep: 1686.8, shape: [ 629.9, 478.0, "W"]  },
      { name: "New Westminster",           arr: 1837.8, dep: 1866.0, shape: [ 701.3, 474.0, "S"]  },
      { name: "Columbia",                  arr: 1921.8, dep: 1951.2, shape: [ 737.3, 445.3, "N"]   },
      { name: "Scott Road",                arr: 2125.0, dep: 2150.5, shape: [ 805.1, 449.1, "NE"]  },
      { name: "Gateway",                   arr: 2280.2, dep: 2306.8, shape: [ 863.6, 470.9, "E"]  },
      { name: "Surrey Central",            arr: 2394.0, dep: 2424.2, shape: [ 886.0, 520.0, "E"]  },
      { name: "King George",               arr: 2495.0, dep: null,   shape: [ 900.0, 568.5, "W"]  }
    ]
  }
};
