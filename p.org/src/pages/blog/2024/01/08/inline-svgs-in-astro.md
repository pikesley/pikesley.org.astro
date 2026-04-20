---
publish: true
layout: ../../../../../layouts/BlogPost.astro
title: Inline SVGs in Astro
description:

mastodon:
  toot: "123"
---

Until very recently I was using the [@mdi/font](https://github.com/pikesley/pikesley.org.astro/blob/24e16f1d5e4c4c2cfa53978022646628e61e1899/p.org/package.json#L20) package for the various [logos](https://github.com/pikesley/pikesley.org.astro/blob/24e16f1d5e4c4c2cfa53978022646628e61e1899/p.org/src/pages/index.astro#L23) around this site. However I was always bothered by MDI's (now Pictogrammers, I guess?) [entreaties not to use the Webfont](https://pictogrammers.com/docs/guides/webfont-alternatives/), (I tried the suggested alternative of [Iconify](https://pictogrammers.com/docs/guides/iconify/) but it was ugly and painful) and then when I was making some updates today I noticed that [they're about to deprecate support for brand icons](https://pictogrammers.com/docs/library/mdi/guides/brand-icons/#what-will-happen-with-current-brand-icons-in-mdi), which kind of forced my hand (cards on the table, I have a day off and it's too cold to go cycling today).

## Enter Simple Icons

Pictogrammers' recommended alternative source of brand icons is [Simple Icons](https://simpleicons.org/). I've previously had some patchy experience with using third-party SVGs, but the Simple Icons are all clean, tidy 24x24 single-colour images, which makes them much nicer to work with. So, how to embed them in a nice, repeatable, configurable way?

The beautiful consistency of these icons led me to my first move, [pulling the _d_ data out of each file](https://github.com/pikesley/pikesley.org.astro/blob/main/p.org/src/data/logos.yaml), yielding a file like this:

```yaml
mastodon:
  data: M23.268 5.313c-.35-2.578-2.617-4.etc.svg.stuff.I.don't.understand

github:
  data: M12 .297c-6.63 0-12.etc.etc
```

So now we need [a template to shove these into](https://github.com/pikesley/pikesley.org.astro/blob/c7dc8e3786854fcea4771da783d8773045934a8e/p.org/src/components/Logo.astro):

```javascript
---
import Logos from "../data/logos.yaml";

export interface Props {
  logoName: string;
  klass: string
}

const { logoName, klass } = Astro.props;
---

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class:list={[`${klass}`]}>
  <path d={Logos[logoName].data} />
</svg>
```

This is just the skeleton of one of the original SVGs. We can call it like this:

```javascript
---
import Logo from "../components/Logo.astro";
---

<Logo logoName="github" klass="front-page"/>
```

which fetches the `github.data` from the YAMl and renders a nice inline SVG into our document, and it works!

### Problems with styling

Except that styling these is a pain: the reason I was choosing to embed the SVGs directly into the file, rather than wrap them in `<img>` tags, is because then they become stylable via CSS. As I've [written about elsewhere](/blog/2023/03/06/mastodon-powered-comments-in-astro/), Astro does some clever namespacing stuff (it used to be with a `class`, it now appears to insert a `data-astro-cid-somehash` attribute) at render/build-time, allowing `<style>` to be embedded right in each component with no leakage. However with this `<Logo/>` component, the SVGs are rendered with no such namespacing, which means we need to pass in that `klass` parameter, and then use [ugly, ugly global styles like this](https://github.com/pikesley/pikesley.org.astro/blob/c7dc8e3786854fcea4771da783d8773045934a8e/p.org/src/pages/index.astro#L77-L93):

```css
<style is:global>
  svg.front-page {
    width: 50%;
    margin-inline: auto;
    margin-block: 1rem;
  }
</style>
```

which removes a lot of the power of Astro.
