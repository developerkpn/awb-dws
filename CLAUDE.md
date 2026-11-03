# AWB-DWS

Read `README.md` for the layout, rules and commands. `BLUEPRINT.md` is the plain-language status for management (printed as PDF); `TECHNICAL.md` lists everything in the code plus the technical decisions and history. Both are in Indonesian.

## Keep BLUEPRINT.md and TECHNICAL.md current

Follow "Cara memperbarui" in `TECHNICAL.md`.

- Any change that adds, renames or removes an app, domain, module, endpoint, Prisma model or migration, contract, frontend feature, device adapter, external integration or shared package updates `TECHNICAL.md` in the same change. When progress of an area changes, update section 3 of `BLUEPRINT.md` too.
- `BLUEPRINT.md` stays non-technical: no code names, versions or tooling. Technical decisions and history go in `TECHNICAL.md`; business decisions and history that matter to management go in `BLUEPRINT.md`.
- Every change gets a new history row (Sebelumnya, Sekarang, Alasan). Never edit or delete existing history rows; write corrections as new rows.
- Never delete or rewrite a decision row. When a decision changes, add a new K-xx row and set the old row's Status to "digantikan oleh K-xx". K-xx and R-xx numbers are shared by both documents.
- `npm run check:blueprint` (part of `npm run check`) enforces coverage and these history rules against the last commit.
- Regenerate the management PDF with `npm run blueprint:pdf` (first time `npm run docs:setup`); the check warns when it is out of date.

## Before finishing a change

Run `npm run check`. It needs the local databases (`npm run db:up`).

## Writing docs and comments

- Table and column names: `mst_` for master data, `awb_` for transactions, English `snake_case` columns; see `docs/design/penamaan-tabel.md`.
- Comments only when the code can't explain itself; at most 2 lines each, and few of them. Longer explanations go in a README next to the code or in `TECHNICAL.md`.
- Describe conventions directly. Don't name other projects as the source or inspiration of a convention anywhere in this repository.
