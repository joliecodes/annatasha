# annatasha.com

Landing page and blog. Jekyll site with a writing desk (Decap CMS) at **/admin**, hosted on Netlify.

## Writing (day to day)
1. Go to **www.annatasha.com/admin** and log in.
2. **Posts → New Post.** Add a title, a date and your moods, then write.
   - Photos: use the image button in the editor. To add a caption, put a line of *italics* right under the photo.
   - A line made of `---` becomes a little ✦ ✦ ✦ divider.
3. Click **Publish**. The site updates in about a minute.

You can edit **About the writer** and the **Landing page note** under **Site text**.

The two sample posts are in `_posts/`. Delete them from the editor once your real first post is in.

## Adding a new mood later
Add it in two places, using the same `slug`:
- `_data/moods.yml`: name, caption (shown in the hover bubble), colour, icon
- `admin/config.yml`: under Moods → options

## Going live (one-time setup)
1. **GitHub:** create a new repository (e.g. `annatasha-site`), then upload everything in this folder to the `main` branch.
2. **Netlify:** Add new site → Import an existing project → GitHub → choose the repo. The build settings come from `netlify.toml`, so just deploy.
3. **Turn on the editor login:** in Netlify, go to Project configuration → Identity → Enable Identity.
   - Registration → set to **Invite only**.
   - Services → **Git Gateway** → Enable.
   - Identity → Invite users → invite your own email address. Open the email, accept, and you'll land on /admin to set a password.
4. **Domain:** Netlify → Domain management → Add domain → `annatasha.com`. Then in **Hover** → DNS for annatasha.com:
   - Delete the old Squarespace A/CNAME records for `@` and `www`.
   - `A` record, host `@` → `75.2.60.5`
   - `CNAME` record, host `www` → `<your-site-name>.netlify.app`
   - DNS changes can take up to a day. Netlify adds HTTPS automatically.

Only switch the DNS when you're ready to leave Squarespace. You can write on the free `.netlify.app` address until then.
