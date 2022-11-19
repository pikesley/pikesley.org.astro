import { marked } from "marked";

export function GHLink(proj) {
  return `//github.com/${proj.github}`;
}

export function replaceVid(line) {
  if (line.match(/.*githubusercontent.*mp4/)) {
    var result = '<div class="video-wrapper">';
    result += "<iframe src=";
    result += `"${line}" `;
    result += "allowfullscreen ";
    result += 'frameborder="0" ';
    result +=
      'allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"';
    result += "></iframe></div>";

    return result;
  } else {
    return line;
  }
}

export function fixImages(line, proj) {
  // match markdown images with local URLs
  if (line.match(/^!\[[a-z]/)) {
    line = line
      .replace("](", `](//github.com/${proj.github}/blob/main/`)
      .replace(/\)$/, "?raw=true)");
  }
  return line;
}

export function refineReadme(b64, proj) {
  // https://docs.astro.build/en/guides/markdown-content/#fetching-remote-markdown
  const markdown = atob(b64); // base64-decode it
  const lines = markdown.split("\n"); // turn it into a array of lines
  const startAt = lines.findIndex((line) => /^#[^#]/.test(line)); // find the first (and only) `h1`
  const trimmed = lines.slice(startAt + 1); // cut off the `h1` and everything above it
  const videoFixed = trimmed.map((line) => replaceVid(line)); // locate any `mp4` videos and wrap them in an `iframe`
  const imageFixed = videoFixed.map((line) => fixImages(line, proj)); // provide full GH URL for an `img`

  const reconstituted = imageFixed.join("\n"); // join it all back into a single string
  const rendered = marked.parse(reconstituted); // parse the markdown into HTML

  return rendered;
}

export function fullURLs(line, slug = null) {
  const words = line.split(" ");
  var fixedWords = [];
  const regex = /([a-zA-Z0-9]*\]\()((?!(http|\/\/)).*)\)/;

  words.forEach(function (word) {
    var matched = word.match(regex);
    if (matched) {
      word = word.replace(
        matched[2],
        `//github.com/some/repo/blob/main/${matched[2]}`
      );
    }

    fixedWords.push(word);
  });

  return fixedWords.join(" ");
}
