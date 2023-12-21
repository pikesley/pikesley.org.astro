import { marked } from "marked";
import { Buffer } from "buffer";

export function GHLink(proj) {
  return `//github.com/${proj.github}`;
}

export function replaceVid(line) {
  if (line.match(/.*githubusercontent.*mp4/)) {
    var result = '<video controls loop src="';
    result += line;
    result += '"></video>';

    return result;
  } else {
    return line;
  }
}

export function fixImages(line, slug) {
  // match markdown images with local URLs
  if (line.match(/^!\[.*\]\(((?!(http|\/\/)).*)\)/)) {
    line = line
      .replace("](", `](//github.com/${slug}/blob/main/`)
      .replace(/\)$/, "?raw=true)");
  }
  return line;
}

export function fullURLs(line, slug) {
  const words = line.split(" ");
  var fixedWords = [];
  const regex = /([a-zA-Z0-9`]*\]\()((?!(http|\/\/)).*)\)/;

  words.forEach(function (word) {
    var matched = word.match(regex);
    if (matched) {
      const replacement = `//github.com/${slug}/blob/main/${matched[2]}`;
      word = word.replace(`(${matched[2]})`, `(${replacement})`);
    }

    fixedWords.push(word);
  });

  return fixedWords.join(" ");
}

export function refineReadme(b64, proj) {
  // https://docs.astro.build/en/guides/markdown-content/#fetching-remote-markdown
  const markdown = Buffer.from(b64, "base64").toString();
  const lines = markdown.split("\n"); // turn it into a array of lines
  const startAt = lines.findIndex((line) => /^#[^#]/.test(line)); // find the first (and only) `h1`
  const trimmed = lines.slice(startAt + 1); // cut off the `h1` and everything above it
  const videoFixed = trimmed.map((line) => replaceVid(line)); // locate any `mp4` videos and wrap them in an `iframe`
  const imageFixed = videoFixed.map((line) => fixImages(line, proj.github)); // provide full GH URL for an `img`
  const URLFixed = imageFixed.map((line) => fullURLs(line, proj.github));

  const reconstituted = URLFixed.join("\n"); // join it all back into a single string
  const rendered = marked.parse(reconstituted); // parse the markdown into HTML

  return rendered;
}
