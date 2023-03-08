---
publish: true
layout: ../../../../../layouts/BlogPost.astro
title: Massively Over-Engineering A Static Website
description: We may discover, as we so often do, that my primary purpose is to serve as a warning to others
image: /assets/images/linked-data.jpg

mastodon:
  toot: "109916350521031860"

---

This story begins in 2014, when I first became aware of the joy of static-site generators. I'd been bumbling around with WordPress, trying to build a website for my band, and then, through working with [James](https://floppy.org.uk/) on the first version of the website for Open Addresses (a doomed, cursed project, unfortunately), I was exposed to the wonders of [Jekyll](https://jekyllrb.com/).

I spent plenty of evenings and weekends crafting the new band site, and soon realised that the way Jekyll likes to structure blog content, with a file at `blog/_posts/1970-01-01-some-blog-post.md` generating a post at `https://yoursite.com/blog/1970/01/01/some-blog-post/` would be *ideal* for individual gig posts. This will be important later.

A brief aside: while implementing this, it occurred to me that it was now possible to [book the band by pull-request](https://github.com/rawfunkmaharishi/rawfunkmaharishi.github.io/blob/master/gigs/_posts/HOW_TO_BOOK_THE_BAND.md). I imagine it will come as no surprise to anybody reading this to learn that, in the eight years this feature has been available, nobody has ever attempted to book us this way, _but_ I did meet [Ben Balter](https://ben.balter.com/) at the ODI Summit and tell him about it, and I believe he included it on an internal Github newsletter, and we [also got on the front page of Hacker News](https://news.ycombinator.com/item?id=11149584), but fuck those guys.

It was at that same ODI Summit (I think) that I heard Sir Tim Berners-Lee talking about how musicians were using JSON-LD for discoverability, which led to me [embedding some extremely noddy JSON in our pages](https://github.com/rawfunkmaharishi/rawfunkmaharishi.github.io/blob/master/_includes/json-ld.html). This also will be important later.

Advance the calendar to early 2018, and we had [a new record coming out](https://www.youtube.com/playlist?list=PLuPLM2FI60-OlLoRt_FsbRFmi6v5wXKm9), which inspired me to [rebuild the site from the ground up](https://github.com/rawfunkmaharishi/website-2018), using the then-brand-new [Bootstrap 4](https://getbootstrap.com/docs/4.0/getting-started/introduction/). I had, by this time, learned to not fear JavaScript, so there are a *lot* of JS gimmicks on this iteration of the site.

This site had served us OK for nearly 5 years, but in late 2022 we [returned to the recording studio](https://mastodon.me.uk/@pikesley/109506051605631173) so with a new record on the horizon, I felt it was time for a new website. And this is where the bullshit really began.

Jekyll is powerful and can do some amazing things (I once tortured it into [generating GeoJSON for every gig we've ever played](https://github.com/rawfunkmaharishi/website-2018/blob/master/gig-map.json), which is really not easy without any kind of test framework), but I really hate its [Liquid](https://shopify.github.io/liquid/) templating engine, so I set about looking for something new, and from watching [Kevin Powell's CSS videos](https://www.youtube.com/kevinpowell) I learned about [Astro](https://astro.build/), a JavaScript-powered static-site generator.

### Data-first

Previously, things like gig pages were being [generated from YAML (embedded in frontmatter)](https://github.com/rawfunkmaharishi/website-2018/blob/master/gigs/_posts/2019-05-18-paper-vintage.md), and then the JSON-LD was being generated per-page and embedded, but this was always a little clunky and I knew I could build something better. It seemed to me that the JSON-LD ought to be a first-class concept, with everything else being an artefact derived from it. So I attempted to make this happen.

I ran those old markdown-with-frontmatter-YAML documents through a hastily-written Python script to turn them into legit YAML, installed a YAML plugin in Astro, and got to work. And it was horrible. It turns out that attempting to create structured-JSON-from-YAML in a JavaScript framework, and then trying to use that generated JSON to derive some static HTML (using JavaScript) quickly turns into an ouroboros of hate.

I took a step back around about here and had a look at the data I was working with, and the first thing I noticed was that there was a lot of redundancy. For example, the data for an individual gig might look like this:

```yaml
location: Luna, 7 Church Lane, Leytonstone, E11 3DR
time: "21:00"
latitude: 51.5682837
longitude: 0.0101648
venue_website:
  url: //www.lunalivemusic.com/#Whats-On
  text: Luna
```

but then all other gigs at the same venue would also have those same `location`, `latitude`, `longitude` and `venue_website` fields, which I'd been blindly copy-pasting for years. All this file really needs is the `time` (the date is encoded in the filename) and a pointer to the `location`, which we can define elsewhere.

So I got to work normalising, _by hand_ (and using a handful of shonky, definitely-not-idempotent scripts), dozens of YAML files, into this sort of form:

```yaml
time: '21:00'
venue: luna
```

where `luna` is the identifier for

```yaml
address: 7 Church Lane
latitude: 51.5681154
longitude: 0.0103544
name: Luna Lounge
postcode: E11 1HG
website: https://www.lunalivemusic.com/
image: luna.jpg
```

Now it turns out that referential integrity is really hard to keep track of with hand-crafted artisan YAML, and there's a reason why we have databases, but this all has to be built and deployed as a static site on Netlify, and I don't see where a database can fit in to that pipeline.

With my new shiny normalised data, I returned to Astro with renewed vigour, and once again got stuck pushing JSON up a hill.

### Let's build some middleware like it's 2005

So I did what any of us would have done in this situation, and started building, in Python, [a bespoke static-site generator purely for the JSON](https://github.com/rawfunkmaharishi/data). While this might sound unhinged, or that I was doing this purely for the sake of of doing it (both of which might be true), it actually inverted the whole problem and made it _much_ easier to think about. I now have some [massively de-normalised JSON](https://json.rawfunkmaharishi.uk/gigs.json) generated using some [fully tested code](https://github.com/rawfunkmaharishi/data/blob/main/tests/test_gig.py), from a [small collection of tiny YAML files](https://github.com/rawfunkmaharishi/data/tree/main/data). It's not really an API (or maybe it is?) but it's ideal for what I need.

And this time around, I [immersed myself deeply in schema.org](https://schema.org/) and produced [much richer data than I ever had before](https://json.rawfunkmaharishi.uk/raw-funk-maharishi.json).

And now, when I returned to Astro, I was able to pull the data from my new service (Astro supports the bewildering `await fetch` JavaScript nonsense), confident that it was all correct and clean. I had initially bolted-on some `offSchema` additional data to the JSON, in order to simplify rendering at the Astro end, but this quickly started to offend my sense of purity, so I nuked all of that, and after a few iterations, it became clear that using pure unsullied schema.org-compliant JSON as the Source Of Truth works just fine, and I was able to derive everything I needed very easily.

So now, at build-time, each page pulls the JSON it needs, generates its HTML from that, and also places it as JSON-LD into the `<head>`. And, just because I could, for each `.html` page there's also a `.json` page showing just the data, because as a [very wise person](https://www.jenitennison.com/) once told me, "your website is your API". It's not perfect, because it's based on requesting the URL with the `.json` extension, but I doubt I'll be able to convince Netlify to support Content-Negotiation, so it will have to do for now.

And that's where are now: Astro turns out to be quite nice to use when you're not trying to bend it into weird shapes, and the [preview site is live here](https://rawfunkmaharishi.netlify.app/) - the colours are temporary until the art for the new record is finalised, but all of the functionality is there. And of course there's also lots of lovely (fully [validated](https://validator.schema.org/#url=https%3A%2F%2Frawfunkmaharishi.netlify.app%2Frecords%2Fre%3Adesigned%2F)) [linked-data](https://rawfunkmaharishi.netlify.app/records/re:designed.json).

[This Mastodon thread](https://mastodon.me.uk/@pikesley/109480247328766742) has been tracking this whole ridiculous story in real time, and will probably continue as I attempt further stupid feats of pointless over-engineering for a website that only about 6 people will ever look at.
