#!/bin/sh

cat > settings.json << EOF
{
    "public": {
        "commit": "$(git rev-parse HEAD)",
        "timestamp": "$(git log -1 --date=short --pretty=format:%cd)"
    }
}
EOF