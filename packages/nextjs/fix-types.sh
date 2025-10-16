#!/bin/bash

# Fix shared/hooks/index.ts duplicate exports
sed -i '/export \* from '\''\.\/useStudies'\'';/d' shared/hooks/index.ts

# Fix circomlibjs import
sed -i '13s/.*/\/\/ @ts-ignore\nimport { buildPoseidon } from '\''circomlibjs'\'';/' shared/lib/eligibility-codes.ts

# Fix HumanPassportVerification import
sed -i '/HumanPassportVerification/d' shared/types/index.ts

# Fix researcher studies page isLoading
find app/researcher/studies -name "page.tsx" -exec sed -i 's/isLoading/loading/g' {} \;

# Fix studies page StudyStatus.Recruiting
sed -i 's/StudyStatus\.Recruiting/StudyStatus.Active/g' app/studies/page.tsx

echo "Type fixes applied!"
