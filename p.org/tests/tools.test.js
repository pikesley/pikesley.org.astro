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
