#!/bin/bash

pnpm run build

rm -rf ./src-server/web/*

cp -r ./dist/* ./src-server/web/

cd ./src-server

echo "building amd64 win"

go env -w GOOS=windows GOARCH=amd64
go build -o ../miao-directory-amd64-win.exe

echo "building amd64 linux"

go env -w GOOS=linux GOARCH=amd64
go build -o ../miao-directory-amd64-linux

# go env -w GOOS=linux GOARCH=arm64
# go build -o ../miao-directory-arm64-linux

echo "build finish"