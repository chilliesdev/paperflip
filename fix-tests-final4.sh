# Fix DB9 in resegmentation.test.ts (needs resetDb() properly in afterEach or beforeEach to clear singleton state)
sed -i 's/vi.clearAllMocks();/vi.clearAllMocks();\n    resetDb();/g' apps/web/src/tests/lib/resegmentation.test.ts || true

# Re-link paths correctly
sed -i 's/"..\/..\/lib\/segmenter"/"@paperflip\/core\/segmenter"/g' apps/web/src/tests/components/PdfUploader.test.ts
sed -i 's/..\/..\/lib\/database/$lib\/database-init/g' apps/web/src/tests/components/PdfUploader.test.ts
sed -i 's/"..\/..\/lib\/segmenter"/"@paperflip\/core\/segmenter"/g' apps/web/src/tests/components/PdfUploaderRepro.test.ts
sed -i 's/..\/..\/lib\/database/$lib\/database-init/g' apps/web/src/tests/components/PdfUploaderRepro.test.ts

# Re-link correctly for lib tests
sed -i 's/..\/..\/lib\/database/$lib\/database-init/g' apps/web/src/tests/lib/database.test.ts
sed -i 's/..\/..\/lib\/database/$lib\/database-init/g' apps/web/src/tests/lib/resegmentation.test.ts
