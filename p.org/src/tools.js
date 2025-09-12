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

export function fixGithubImages(line, slug) {
  // match markdown images with local URLs
  if (line.match(/^!\[.*\]\(((?!(http|\/\/)).*)\)/)) {
    line = line
      .replace("](", `](//github.com/${slug}/blob/main/`)
      .replace(/\)$/, "?raw=true)");
  }
  return line;
}

export function fixCodebergImages(line, slug) {
  if (line.match(/^!\[.*\]\(((?!(http|\/\/)).*)\)/)) {
    line = line.replace("](", `](//codeberg.org/${slug}/media/branch/main/`);
  }
  return line;
}

export function fullGithubURLs(line, slug) {
  return fullURLs(line, `//github.com/${slug}/blob/main/`);
}

export function fullCodebergURLs(line, slug) {
  return fullURLs(line, `//codeberg.org/${slug}/src/branch/main/`);
}

function fullURLs(line, prefix) {
  const words = line.split(" ");
  var fixedWords = [];
  const regex = /([a-zA-Z0-9`]*\]\()((?!(http|\/\/)).*)\)/;

  words.forEach(function (word) {
    var matched = word.match(regex);
    if (matched) {
      const replacement = `${prefix}${matched[2]}`;
      word = word.replace(`(${matched[2]})`, `(${replacement})`);
    }

    fixedWords.push(word);
  });

  return fixedWords.join(" ");
}

export function refineReadme(markdown, proj) {
  // https://docs.astro.build/en/guides/markdown-content/#fetching-remote-markdown

  var methods = {
    images: fixGithubImages,
    urls: fullGithubURLs,
  };
  var slug = proj.github
  if (proj.codeberg) {
    methods = {
      images: fixCodebergImages,
      urls: fullCodebergURLs,
    };
    slug = proj.codeberg
  }

  const lines = markdown.split("\n"); // turn it into a array of lines
  const startAt = lines.findIndex((line) => /^#[^#]/.test(line)); // find the first (and only) `h1`
  const trimmed = lines.slice(startAt + 1); // cut off the `h1` and everything above it
  const videoFixed = trimmed.map((line) => replaceVid(line)); // locate any `mp4` videos and wrap them in an `iframe`
  const imageFixed = videoFixed.map((line) =>
    methods.images(line, slug)
  ); // provide full GH URL for an `img`
  const URLFixed = imageFixed.map((line) => methods.urls(line, slug));

  const reconstituted = URLFixed.join("\n"); // join it all back into a single string
  const rendered = marked.parse(reconstituted); // parse the markdown into HTML

  return rendered;
}

export function refineB64Readme(b64, proj) {
  const markdown = Buffer.from(b64, "base64").toString();
  return refineReadme(markdown, proj);
}
