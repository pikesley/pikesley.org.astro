import { fullURLs } from "../src/tools.js";

test("it does nothing with a plain line", () => {
  expect(fullURLs("just some text", "foo/bar")).toEqual("just some text");
});

test("it does nothing with already-full URLs", () => {
  expect(fullURLs("foo [link](https://bar.com/baz) foo", "what/ever")).toEqual(
    "foo [link](https://bar.com/baz) foo"
  );
});

test("it replaces a single local URL", () => {
  expect(fullURLs("[pin 21](lib/hat.py#L23)", "some/repo")).toEqual(
    "[pin 21](//github.com/some/repo/blob/main/lib/hat.py#L23)"
  );
});

test("it replaces multiple local URLs", () => {
  expect(
    fullURLs(
      "[pin 21](lib/hat.py#L23) foo [take lots of photos](camera/README.md)",
      "some/repo"
    )
  ).toEqual(
    "[pin 21](//github.com/some/repo/blob/main/lib/hat.py#L23) foo [take lots of photos](//github.com/some/repo/blob/main/camera/README.md)"
  );
});

test("it handles a mixed-bag of content", () =>
  expect(
    fullURLs(
      "foo [link](bar.com/baz) bar [link](https://bar.com/baz) baz [link](//baz.com/bar) abc",
      "some/thing"
    )
  ).toEqual(
    "foo [link](//github.com/some/thing/blob/main/bar.com/baz) bar [link](https://bar.com/baz) baz [link](//baz.com/bar) abc"
  ));

test("it handles the same string in text and URL", () =>
  expect(fullURLs("[foo/bar.js](foo/bar.js)", "this/that")).toEqual(
    "[foo/bar.js](//github.com/this/that/blob/main/foo/bar.js)"
  ));

test("it handles a `", () =>
  expect(fullURLs("[`some code`](foo.js)", "a/b")).toEqual(
    "[`some code`](//github.com/a/b/blob/main/foo.js)"
  ));
