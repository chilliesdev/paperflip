cat turbo.json | sed 's/"test": {}/"test": { "dependsOn": ["^build"] }/g' > turbo.tmp
mv turbo.tmp turbo.json

pnpm run build --filter=@paperflip/core
pnpm run test --filter=@paperflip/web | grep -C 5 "FAIL"
