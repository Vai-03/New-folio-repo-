# Editing your project pages

Each project page is one file in the `work/` folder. Edit it on GitHub and Vercel puts the change live in about a minute. You don't need to install anything.

| Project | File |
|---|---|
| Service Forge | `work/service-forge.html` |
| AI academic dashboards | `work/ai-academic-dashboards.html` |
| Clinical AI | `work/clinical-ai.html` |
| Field ops | `work/field-ops.html` |
| Unvoro (AI SEO) | `work/unvoro.html` |

## How to edit

1. Open the file on GitHub, e.g. https://github.com/Vai-03/New-folio-repo-/blob/main/work/service-forge.html
2. Click the **pencil icon** (top right of the file), or press `.` to open the full editor.
3. Use **Ctrl/Cmd + F** to find the sentence you want to change. Change only the words *between* the tags. For example, in `<p>Old sentence.</p>` you replace `Old sentence.` and leave `<p>` and `</p>` as they are.
4. Click **Commit changes** and commit straight to `main`. The live site updates shortly after.

## Where things are on each page

| What you see | What to search for |
|---|---|
| Title, one-line tagline, tags | `class="case-hero"` |
| Big Figma / prototype button (top) | `class="hero-cta"` |
| Overview: objective, problem, role | `-overview"` |
| Research insights | `-research"` |
| Personas (3 cards) | `class="persona"` |
| User journey (4 steps) | `class="journey"` |
| Approach (4 steps) | `class="approach"` |
| The solution + second CTA button | `-solution"` |

**Changing a CTA link:** the Figma button appears twice (top and in "The solution"). Change the `href="..."` on both.

**Removing a whole section:** delete everything from `<section class="cs" id="...">` down to its matching `</section>`. Also delete its line in the "On this page" list (search for the same id, e.g. `#service-forge-research`), and update the `01 / 06` section numbers.

**Adding an image:** upload it to the `assets/` folder (Add file → Upload files), then copy an existing `<figure class="hero-shot ...">` block and change the `src="/assets/your-image.jpg"` and the `alt="..."` description.

If something looks broken after a change, open the file's **History** on GitHub and revert the last commit.
