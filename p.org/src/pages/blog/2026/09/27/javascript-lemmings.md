---
publish: true
layout: ../../../../../layouts/BlogPost.astro
title: Lemmings in JavaScript
description: Run-Length Encoded sprites for some reason

mastodon:
  toot: "117356416073090195"
---

<iframe
  id="lemmings"
  title="Lemmings"
  width="400"
  height="200"
  src="https://js-lemmings.netlify.app/?lemmings=2">
</iframe>

This story begins with the [EMF](https://www.emfcamp.org/) [Tildagon](https://tildagon.badge.emfcamp.org/). I got _far_ too into making apps for this thing (I am still [the top-ranked app author by number of apps](https://hat-village.codeberg.page/app-store-stats/)), and an I idea I hit upon that produced some nice results was [animating old video-game sprites](https://mastodon.me.uk/@pikesley/116303723524895561). So let's try and remember what I did and how that made its way [onto a webpage](https://js-lemmings.netlify.app/).

This is not intended as a comprehensive how-to, and a lot of the code we're going to look at has some rough edges (the places where I made Decisions will become very clear, I think), but there is some interesting stuff here. So:

## The Raw Materials

People have a lot of affection for the video games they used to play, so it's no surprise that it's [easy to find spritesheets](https://www.spriters-resource.com/amiga_amiga_cd32/lemmings/asset/37732/). We can download one of these, then using Preview or GIMP or whatever we have to hand, [cut out the strip of the particular sprite we want to animate](https://codeberg.org/pikesley/tildagon-lemmings/src/branch/main/sources/strips/basher.png). We need to be careful how we cut this: the width needs to be an integer multiple of the width of a single frame, or the subsequent steps will break in confusing ways. Some of the spritesheets I found don't lay the sprites out on a consistent grid, which seems psychotic to me, and makes all of what follows way more fiddly.

OK, given that we have this strip and it's the correct size, we can turn our attention to some terrible Python scripts:

### `splitter.py` 

```python
from pathlib import Path

from PIL import Image

for lemming in Path("sources/strips").glob("*"):
    print(lemming)
    outdir = Path("sources/crops", lemming.stem)
    outdir.mkdir(exist_ok=True, parents=True)

    strip = Image.open(lemming)
    for i in range(int(strip.width / 16)):
        left = i * 16
        right = left + 16
        height = strip.height
        filename = f"{str(i).zfill(2)}.png"

        with Path.open(f"{outdir}/{filename}", "wb") as f:
            strip.crop((left, 0, right, height)).save(f)

```

[source](https://codeberg.org/pikesley/tildagon-lemmings/src/branch/main/tools/splitter.py)

The first thing to note is that we need [Pillow](https://pillow.readthedocs.io/). Also, there's a whole load of hard-coded horrors here:

- We expect to find the sprite strips in a directory called `sources/strips/`
- We will dump our output into `sources/crops/<name-of-strip>/`, named like `00.png` etc

Also, see all those `16`s nailed in there? Yeah, that's specific to the dimensions of these particular sprites. There should probably be some metadata attached somewhere.

Whatever, the core logic is sound: take the strip and chop it into 16-pixel-wide pieces, one for each frame of the sprite.

Then take those little PNGs and run them through the next script:

### `bitmapper.py`

```python
import json
from itertools import batched
from pathlib import Path

from PIL import Image

lookups = {
    "[0, 0, 0]": "bg",
    "[95, 99, 255]": "cl",
    "[114, 126, 255]": "cl",
    "[0, 179, 0]": "hr",
    "[0, 180, 0]": "hr",
    "[0, 189, 0]": "hr",
    "[255, 235, 223]": "sk",
    "[255, 236, 224]": "sk",
    "[255, 240, 230]": "sk",
    "[255, 255, 0]": "um",
    "[255, 251, 0]": "um",
    "[99, 0, 19]": "dt",
    "[99, 0, 11]": "dt",
    "[255, 0, 0]": "sc",
}

for move in Path("sources/crops").glob("*"):
    print(move)
    outdir = Path("sources/bitmaps", move.name)
    outdir.mkdir(exist_ok=True, parents=True)
    for file in Path(move).glob("*"):
        img = Image.open(file)
        data = [
            [lookups[str(list(x[0:3]))] for x in row]
            for row in batched(img.get_flattened_data(), img.width)
        ]

        Path(outdir, f"{file.stem}.json").write_text(
            json.dumps(data, indent=2), encoding="utf-8"
        )
```

[source](https://codeberg.org/pikesley/tildagon-lemmings/src/branch/main/tools/bitmapper.py)

This takes the sprite frames from the previous step and turns them into JSON:

```json
[
    ["bg","bg","bg","bg","bg","bg","bg","bg","hr","hr","bg","bg","bg","bg","bg","bg"],
    ["bg","bg","bg","bg","sk","sk","bg","hr","hr","sk","bg","bg","bg","bg","bg","bg"],
    ["bg","bg","bg","bg","sk","sk","bg","hr","sk","sk","sk","bg","bg","bg","bg","bg"],
    ["bg","bg","bg","bg","bg","bg","sk","sk","sk","cl","bg","bg","bg","bg","bg","bg"],
    ["bg","bg","bg","bg","bg","bg","bg","bg","cl","cl","bg","bg","bg","bg","bg","bg"],
    ["bg","bg","bg","bg","bg","bg","bg","cl","cl","cl","sk","bg","bg","bg","bg","bg"],
    ["bg","bg","bg","bg","bg","bg","bg","cl","cl","cl","sk","bg","bg","bg","bg","bg"],
    ["bg","bg","bg","bg","bg","bg","cl","cl","bg","cl","bg","bg","bg","bg","bg","bg"],
    ["bg","bg","bg","bg","bg","sk","sk","bg","bg","sk","sk","bg","bg","bg","bg","bg"]
]

```

where those symbols represent `background`, `hair`, `skin`, and `clothing`. You'll notice the `lookups` at the top there - we extract an RGB triple for each pixel with Pillow, then assign a symbol based on that triple. And for reasons I don't care to understand, those triples sometimes vary across sprites from the same sheet. I imagine you could do something fiendishly clever to work out which RGBs are close enough to count as the same colour, but life is short so we're doing this.

OK, so now we have these blobs of JSON representing individual sprite frames, what next?

### `slimmer.py`

```python
import json
from pathlib import Path

margins = {}

for move in Path("sources/bitmaps").glob("*"):
    print(move)
    leading = 16
    trailing = 16

    for j in Path(move).glob("*"):
        data = json.loads(j.read_text(encoding="utf-8"))

        for row in data:
            l_counter = 0
            for pixel in row:
                if pixel != "bg":
                    if l_counter < leading:
                        leading = l_counter
                        break
                else:
                    l_counter += 1

            r_counter = 0
            for pixel in reversed(row):
                if pixel != "bg":
                    if r_counter < trailing:
                        trailing = r_counter
                        break
                else:
                    r_counter += 1

        margins[move.stem] = {"leading": leading, "trailing": trailing}

for move in Path("sources/bitmaps").glob("*"):
    print(move)
    frames = []
    outdir = Path("sources/slimmed_bitmaps", move.name)
    outdir.mkdir(exist_ok=True, parents=True)
    for j in Path(move).glob("*"):
        data = json.loads(j.read_text(encoding="utf-8"))

        slimmed = []
        ends = tuple(margins[move.stem].values())
        for row in data:
            if ends in ((0, 0), (1, 0)):
                slimmed.append(row[:])
            else:
                slimmed.append(row[ends[0] : -ends[1]])

        frames.append(slimmed[:])
        Path(outdir, f"{j.name}").write_text(
            json.dumps(slimmed, indent=2), encoding="utf-8"
        )
```

[source](https://codeberg.org/pikesley/tildagon-lemmings/src/branch/main/tools/slimmer.py)

Recall that this is all originally being written to run on the Tildagon, so we should probably make our data as small as we can (this is almost certainly overkill, but this is my stupid project, so we're playing by my rules). What this script does is analyse the set of JSON bitmaps for a given sprite, and work out how many columns of `background` colour (which will be rendered as transparent in the final thing) we can strip from each side to leave each frame the same width but still centered correctly, and then strip those columns. There are fewer hard-coded nasties lurking here, because we're in a realm of Pure Data now.

Additionally, having the sprites slimmed down like this makes it easier to think about where they're positioned, and particularly when they count as being _on_ and _off_ the screen.

And finally, let's do some compression:

### `encoder.py`

```python
import gzip
import json
from pathlib import Path

import yaml

conf = yaml.safe_load(Path("conf.yaml").read_text(encoding="utf-8"))
background_symbol = "bg"


def encode_line(line):
    """Encode just the `on` elements from a line."""
    result = []

    current = line[0]
    count = 0
    start_index = 0

    for index, char in enumerate(line):
        if char == current:
            count += 1
        else:
            if current != background_symbol:
                result.append([current, start_index, count])
            current = char
            count = 1
            start_index = index

    if current != background_symbol:
        result.append([current, start_index, count])

    return result


def scale_encode_line(line, scale):
    """Encode with scale and offset."""
    return [[(e[0] - len(line) / 2) * scale, e[1] * scale] for e in encode_line(line)]


def encode_block(block):
    """Encode a block of text."""
    result = []

    for index, line in enumerate(block):
        result.extend([x + [index] for x in encode_line(line)])

    return result


def scale_encode_block(block, scale):
    """Scale-encode a block of text."""
    scaled_lines = [scale_encode_line(line, scale=scale) for line in block.split("\n")]
    result = []
    offset = len(scaled_lines) / 2

    for index, line in enumerate(scaled_lines):
        result.extend([item + [(index - offset) * scale] for item in line])

    return result


def encode(block):
    """Encode."""
    return encode_block(block)


if __name__ == "__main__":
    from pathlib import Path

    outdir = Path(
        "encoded-sprites",
    )
    outdir.mkdir(exist_ok=True, parents=True)

    for move in Path("sources/slimmed_bitmaps").glob("*"):
        print(move)

        movedir = Path(outdir, move.stem)
        movedir.mkdir(exist_ok=True, parents=True)

        encodeds = {"regular": [], "inverted": []}

        for file in sorted(Path(move).glob("*")):
            data = json.loads(file.read_text(encoding="utf-8"))
            encodeds["regular"].append(encode(data))
            encodeds["inverted"].append(encode([list(reversed(x)) for x in data]))

        for key, data in encodeds.items():
            Path(movedir, f"{key}.json.gz").write_bytes(
                gzip.compress(json.dumps(data).encode("utf-8"), mtime=None)
            )

```

[source](https://codeberg.org/pikesley/tildagon-lemmings/src/branch/main/tools/encoder.py)

[Run-length Encoding](https://en.wikipedia.org/wiki/Run-length_encoding) is a form of lossless compression that's not too difficult to reason about, and also fairly straightforward to implement. The key concept is that if we have a row of data that looks like

```python
(0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 0, 0, 0, 0)
```

we can compress that down to something like

```python
((0, 8), (1, 4), (2, 1), (0, 4))
```

which we can read as "8 0s, 4 1s, 1 2, 4 0s". If our data has a lot of long sequences of the same value, the compression is very effective (and if our data is extremely random, it's rubbish).

This script produces lists of objects thus:

```json
["sk", 7, 3, 4]
```

This represents a `sk` cell, starting at column `7`, with a width of `3`, in row `4`.

And that's it. We have reduced a whole PNG strip of sprites to a list of frames that look like this:

```json
[
    ['hr', 8, 2, 0], ['sk', 4, 2, 1], ['hr', 7, 2, 1], ['sk', 9, 1, 1], 
    ['sk', 4, 2, 2], ['hr', 7, 1, 2], ['sk', 8, 3, 2], ['sk', 6, 3, 3], 
    ['cl', 9, 1, 3], ['cl', 8, 2, 4], ['cl', 7, 3, 5], ['sk', 10, 1, 5], 
    ['cl', 7, 3, 6], ['sk', 10, 1, 6], ['cl', 6, 2, 7], ['cl', 9, 1, 7], 
    ['sk', 5, 2, 8], ['sk', 9, 2, 8]
]
```

The ordering is all over the place, but that doesn't matter - each item contains everything it needs to position itself correctly in the final image.

The script also produces `regular` and `inverted` variants of each sprite (it's easier to flip the images here rather than worrying about doing it in the rendering code), and it also `gzip`s everything, but that's only important for the Tildagon app.

So we have all these fancy compressed bitmaps and they [render great on the Tildagon](https://codeberg.org/pikesley/tildagon-lemmings/src/branch/main/lemmings/lemming.py), but that's not why we're here. Let's talk about JavaScript.

## Rendering Lemmings in your browser

Can we take that same data and use it to make some Lemmings amble about in a browser? Yes, of course we can.

### Data and Metadata

We take that RLE JSON we just generated, and [attach some metadata per sprite](https://codeberg.org/pikesley/lemmings-js/src/branch/main/js/modules/sprites.js):

* `orientation`: does this sprite walk across, or move down?
* `width`: how wide is this sprite? Again, we could work this out in the rendering code, but it's way easier to just calculate it once, here
* `height`: how tall is the sprite?
* `stepsPerFrame`: we default to having the lemmings move one sprite-pixel per frame, but for some of the sprites, we need to not move (but still step to the next frame) at some points in order to make the lemming animate correctly. I worked this out by watching a lot of GIFs and videos, and playing a bunch of Lemmings

### Drawing the Lemmings

I'm not going to go deep into how this all works (partly because I wrote this all several months ago and I can't really remember everything), but let's look at some pertinent stuff:

#### HTML `<canvas>`

Each Lemming gets an [HTML `<canvas>`](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) of [its very own](https://codeberg.org/pikesley/lemmings-js/src/branch/main/js/modules/lemming.js#L47) - these are [very easy to move about with JavaScript](https://codeberg.org/pikesley/lemmings-js/src/branch/main/js/modules/lemming.js#L91-L92), so as long as we synchronise those movements with the frame increments, we can make our Lemmings animate convincingly.

To actually draw the Lemming, we [ask the canvas](https://codeberg.org/pikesley/lemmings-js/src/branch/main/js/modules/lemming.js#L52) for a [2d Rendering Context](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D), and then, as the docs say, "With the context in hand, you can draw anything you like".

In our case, we [draw a bunch of rectangles based on the `x`, `y` and `width` from our RLE objects](https://codeberg.org/pikesley/lemmings-js/src/branch/main/js/modules/lemming.js#L100-L104).

#### Colouring the Lemmings

There are five distinct parts of these sprites:

* Skin (also used for the pickaxes)
* Hair
* Clothes (what are they wearing, Lucy & Yak dungarees? Who knows)
* Umbrellas
* Dirt (for the diggers and bashers. The flying dirt is actually part of the sprite, which makes this all very easy)

When each Lemming is spawned, it is [assigned an Outfit](https://codeberg.org/pikesley/lemmings-js/src/branch/main/js/modules/outfit.js#L38), seeded with some `hue` value (which is incremented in the main loop) which gets [rotated around the colour wheel by some number of degrees for each part](https://codeberg.org/pikesley/lemmings-js/src/branch/main/js/modules/outfit.js#L2-L28). The skin colour stays fixed - I tried rotating that in a similar way but it looked very weird.

The `lightness` value of all the parts [gets scaled with the scale of the lemming](https://codeberg.org/pikesley/lemmings-js/src/branch/main/js/modules/outfit.js#L52) - smaller lemmings are dimmer, [and they also get drawn first](https://codeberg.org/pikesley/lemmings-js/src/branch/main/js/main.js#L71-L73), which makes them appear further away.

And that's pretty much it. We just run [a `setInterval` loop](https://codeberg.org/pikesley/lemmings-js/src/branch/main/js/main.js#L85-L95) which animates, moves and draws each lemming, replaces any that have left the screen, and updates the `hue` value.

Oh, and we can pass in a [lemmings=n](https://js-lemmings.netlify.app?lemmings=500) parameter - you'd be amazed how many lemmings your browser can render at once.

## Notes

* I presume that any copyright on these sprites resides with Psygnosis, but they went out of business in 2012 so I imagine nobody actually cares. If you hadn't already guessed, though, I am not a lawyer, so do with any and all of this what you will
* Absolutely no fucking AI Slop has been anywhere near any of this
* Me writing this up is [largely Emily's fault](https://mastodon.me.uk/deck/@emily_s/117342705706468235)
* As ever, I regret nothing