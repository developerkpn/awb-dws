# AWB-DWS

Read `README.md` for the layout, rules and commands, and `BLUEPRINT.md` for what currently exists, how far each part has got, the technical decisions and the change history.

## Keep BLUEPRINT.md current

`BLUEPRINT.md` is written in Indonesian; follow its "Cara memperbarui dokumen ini" section.

- Any change that adds, renames or removes an app, domain, module, endpoint, Prisma model or migration, contract, frontend feature, device adapter, external integration or shared package must update `BLUEPRINT.md` in the same change.
- Every change to the blueprint gets a new row in "5. Riwayat perubahan" with Sebelumnya (before), Sekarang (after) and Alasan (why). Never edit or delete existing history rows; write corrections as new rows.
- Never delete or rewrite a row in "4. Keputusan teknis". When a decision changes, add a new K-xx row and set the old row's Status to "digantikan oleh K-xx".
- `npm run check:blueprint` (part of `npm run check`) enforces coverage and these history rules against the last commit.
- Regenerate the management PDF with `npm run blueprint:pdf` (first time `npm run docs:setup`); the check warns when the PDF is out of date.

## Before finishing a change

Run `npm run check`. It needs the local databases (`npm run db:up`).

## Writing docs and comments

- Comments only when the code can't explain itself; at most 2 lines each, and few of them. Longer explanations go in a README next to the code or in `BLUEPRINT.md`.
- Describe conventions directly. Don't name other projects as the source or inspiration of a convention anywhere in this repository.
