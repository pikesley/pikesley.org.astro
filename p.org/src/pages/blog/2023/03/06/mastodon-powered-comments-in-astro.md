---
publish: true
layout: ../../../../../layouts/BlogPost.astro
title: Mastodon-powered comments in Astro
description: Building interesting things on Open APIs

mastodon:
  toot: "109978502627713538"
---

Building on the work of [Jan Wildeboer](https://jan.wildeboer.net/2023/02/Jekyll-Mastodon-Comments/) ([@jwildeboer](https://social.wildeboer.net/@jwildeboer)) and [Daniel Pecos Martínez](https://danielpecos.com/2022/12/25/mastodon-as-comment-system-for-your-static-blog/) ([@dpecos](https://fosstodon.org/@dpecos)) (and others before them, I'm sure), I have implemented Mastodon-powered comments for [Astro](https://astro.build/).

### How does this work then?

I've built it as an [Astro component](https://github.com/pikesley/pikesley.org.astro/blob/main/p.org/src/components/MastodonComments.astro), which expects to be passed an object called `mastodon` which should look like this:

```json
{
  "host": "mastodon.me.uk",
  "user": "pikesley",
  "toot": "109916350521031860"
}
```

or in `frontmatter` like this:

```yaml
mastodon:
  host: "mastodon.me.uk"
  user: "pikesley"
  toot: "109916350521031860"
```

The `host` and `user` are optional, and [default to `mastodon.me.uk` and `pikesley`](https://github.com/pikesley/pikesley.org.astro/blob/main/p.org/src/components/MastodonComments.astro#L4-L10), which you'll probably want to sweeten to taste.

It uses these to construct the "These comments are generated from replies to this Mastodon post" link at the top of the comment thread, then it pulls that Toot from the Mastodon API and [renders its `descendants`](https://github.com/pikesley/pikesley.org.astro/blob/main/p.org/src/components/MastodonComments.astro#L112) as the comment thread.

> A brief aside: there's something weird going on which I don't quite understand: it only seems to work for a Toot which has no ancestors - a Root Toot, if you will. I tried giving it the ID of a Toot from within a thread, and although its `decendants` list was definitely populated, nothing was rendered. I guess it doesn't actually matter for our purposes here, though.

### How I'm using it

The way this site is structured, a blogpost uses the `BlogPost.astro` layout. Within this layout, if `mastodon` exists in the `frontmatter`, we include the component, passing it the data:

```
  {frontmatter.mastodon && <MastodonComments mastodon={frontmatter.mastodon} />}
```

This site also has [`project`](/projects) pages - a project is basically a blogpost generated from a Github README. These are driven from [some JSON](https://github.com/pikesley/pikesley.org.astro/blob/main/p.org/src/data/projects.json) which feeds a [dynamic Astro page](https://github.com/pikesley/pikesley.org.astro/blob/main/p.org/src/pages/projects/%5Bproject%5D.astro), which is rendered through the [ProjectPage](https://github.com/pikesley/pikesley.org.astro/blob/main/p.org/src/layouts/ProjectPage.astro) layout and similarly, if there's a `mastodon` object in the enclosing object, we call the component:

```
  {mastodon && <MastodonComments mastodon={mastodon}>}
```

There is, as pointed-out in [@jwildeboer](https://social.wildeboer.net/@jwildeboer)'s post, a bootstrapping problem, where we have to Toot first to get the Toot ID, then come back and insert it, but this is not really a big deal.

I think this will _mostly_ work as a drop-in component, modulo changing the default `host` and `user` values. I might actually look into packaging it as a proper [Astro plugin](https://astro.build/integrations/), if anybody has any hints on how to do that.

### Isolating the CSS

The Astro way to build components is to put the CSS in a `<style>` tag right in the component, and then Astro namespaces everything at build-time so nothing leaks. That doesn't really work for us here, though, because those component styles only apply to the static content, where Astro is able to apply a `class="41fb17f6"` or whatever to keep everything scoped. There's no way for it to style client-side dynamic content using this approach (is there? maybe I've missed something), so each Mastodon comment goes into a `<article class="mastodon-comment">` and then the styles are all like

```css
  article.mastodon-comment {
    & span.mastodon-metadata {
      font-size: 0.9rem;
    }
  }
```

inside a `<style is:global>` tag, which makes them into site-wide CSS.

So if you're using Astro (and you should, it's really nice once you lean into its way of thinking) and you're interested in Mastodon-powered comments, please try this out and let me know where it breaks.
