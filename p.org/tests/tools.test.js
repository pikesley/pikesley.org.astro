import {
  fullGithubURLs,
  fixGithubImages,
  fixCodebergImages,
  fullCodebergURLs,
} from "../src/tools.js";

// fullUrls
test("it does nothing with a plain line", () => {
  expect(fullGithubURLs("just some text", "foo/bar")).toEqual("just some text");
});

test("it does nothing with already-full URLs", () => {
  expect(
    fullGithubURLs("foo [link](https://bar.com/baz) foo", "what/ever")
  ).toEqual("foo [link](https://bar.com/baz) foo");
});

test("it replaces a single local URL", () => {
  expect(fullGithubURLs("[pin 21](lib/hat.py#L23)", "some/repo")).toEqual(
    "[pin 21](//github.com/some/repo/blob/main/lib/hat.py#L23)"
  );
});

test("it replaces multiple local URLs", () => {
  expect(
    fullGithubURLs(
      "[pin 21](lib/hat.py#L23) foo [take lots of photos](camera/README.md)",
      "some/repo"
    )
  ).toEqual(
    "[pin 21](//github.com/some/repo/blob/main/lib/hat.py#L23) foo [take lots of photos](//github.com/some/repo/blob/main/camera/README.md)"
  );
});

test("it handles a mixed-bag of content", () =>
  expect(
    fullGithubURLs(
      "foo [link](bar.com/baz) bar [link](https://bar.com/baz) baz [link](//baz.com/bar) abc",
      "some/thing"
    )
  ).toEqual(
    "foo [link](//github.com/some/thing/blob/main/bar.com/baz) bar [link](https://bar.com/baz) baz [link](//baz.com/bar) abc"
  ));

test("it handles the same string in text and URL", () =>
  expect(fullGithubURLs("[foo/bar.js](foo/bar.js)", "this/that")).toEqual(
    "[foo/bar.js](//github.com/this/that/blob/main/foo/bar.js)"
  ));

test("it handles a `", () =>
  expect(fullGithubURLs("[`some code`](foo.js)", "a/b")).toEqual(
    "[`some code`](//github.com/a/b/blob/main/foo.js)"
  ));

// fixImages
test("it replaces a local image", () =>
  expect(
    fixGithubImages(
      "![running jlock](assets/images/jlock.png)",
      "pikesley/jlock"
    )
  ).toEqual(
    "![running jlock](//github.com/pikesley/jlock/blob/main/assets/images/jlock.png?raw=true)"
  ));

test("it leaves alone a fully-URLed image", () =>
  expect(
    fixGithubImages(
      "![schematic](https://svgur.com/i/DQ.svg)",
      "pikesley/jlock"
    )
  ).toEqual("![schematic](https://svgur.com/i/DQ.svg)"));

// Codeberg images
test("it replaces a local image", () =>
  expect(
    fixCodebergImages(
      "![Hot Glue hiding numerous Soldering Crimes](photos/hot-glue-travesty.jpg)",
      "pikesley/pocketwatch"
    )
  ).toEqual(
    "![Hot Glue hiding numerous Soldering Crimes](//codeberg.org/pikesley/pocketwatch/media/branch/main/photos/hot-glue-travesty.jpg)"
  ));

// Codeberg URLs
test("it fixes a URL", () =>
  expect(
    fullCodebergURLs(
      "[conf.py](pocketwatch/config/conf.py)",
      "pikesley/pocketwatch"
    )
  ).toEqual(
    "[conf.py](//codeberg.org/pikesley/pocketwatch/src/branch/main/pocketwatch/config/conf.py)"
  ));
