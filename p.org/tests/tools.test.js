import { fullURLs } from "../src/tools.js";

test("it does nothing with a plain line", () => {
  expect(fullURLs("just some text")).toEqual("just some text");
});

test("it does nothing with already-full URLs", () => {
  expect(fullURLs("foo [link](https://bar.com/baz) foo")).toEqual(
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
      "foo [link](bar.com/baz) bar [link](https://bar.com/baz) baz [link](//baz.com/bar) abc"
    )
  ).toEqual(
    "foo [link](//github.com/some/repo/blob/main/bar.com/baz) bar [link](https://bar.com/baz) baz [link](//baz.com/bar) abc"
  ));
