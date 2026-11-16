# annatasha.com

Landing page and blog. Jekyll site with a writing desk (Sveltia CMS) at **/admin**, hosted on GitHub Pages at annatasha.com.

## Writing (day to day)
1. Go to **annatasha.com/admin** and sign in with your access token.
2. **Posts → New Post.** Add a title, a date and your moods, then write. **Save** publishes it; switch off **Live on the site** first to keep it as a draft. To schedule a post, give it a future date and time; the site rebuilds every hour and it goes live then.
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
- Address: **annatasha.com**. DNS at Hover: four `A` records for `@` → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; `CNAME` `www` → `joliecodes.github.io`.
- The writing desk (/admin) is Sveltia CMS. Sign in with **Sign In Using Access Token**, using a GitHub fine-grained token for `joliecodes/annatasha` with Contents: Read and write. If it expires, make a new one the same way.
