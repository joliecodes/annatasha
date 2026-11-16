# annatasha.com

Landing page and blog. Jekyll site with a writing desk (Decap CMS) at **/admin**, hosted on Netlify.

## Writing (day to day)
1. Go to **www.annatasha.com/admin** and log in.
2. **Posts → New Post.** Add a title, a date and your moods, then write.
   - Photos: use the image button in the editor. To add a caption, put a line of *italics* right under the photo.
   - A line made of `---` becomes a little ✦ ✦ ✦ divider.
3. Click **Publish**. The site updates in about a minute.

Under **Site text** you can edit:
- **About the writer**: your name and bio
- **Landing page note**: the small line, the note, and the link text
- **Blog page text**: the heading, the small lines above your name and the moods, and the empty-mood message
- **Moods**: each mood's name and hover caption, and their order

The two sample posts are in `_posts/`. Delete them from the editor once your real first post is in.

## Adding a brand-new mood
Moods can be renamed in the editor, but a new one needs an icon, so ask Claude to add it to `_data/moods.yml`. It shows up in the post editor automatically.

## Hosting
- The site is built and published by **GitHub Pages** on every push to `main` (see `.github/workflows/pages.yml`).
- Address: **blog.annatasha.com**. DNS at Hover: `CNAME` record, host `blog` → `joliecodes.github.io`.
- The writing desk (/admin) logs in with **GitHub**. Netlify is only used for that login step (OAuth provider on the `annatasha` Netlify project); it no longer hosts the site.

## Moving to annatasha.com later
1. GitHub repo → Settings → Pages → Custom domain → `annatasha.com`, and change the `CNAME` file to match.
2. Hover DNS for `@`: four `A` records → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; `CNAME` `www` → `joliecodes.github.io`. Remove the Squarespace records.
3. Update `url` in `_config.yml` and `site_url` / `display_url` in `admin/config.yml`.
