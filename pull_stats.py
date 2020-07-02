#!/usr/bin/env python3
import os
import subprocess
import json
import shutil

if subprocess.call(["wget", "--execute", "robots=off", "--recursive", "--no-host-directories", "--no-parent", "--reject-regex", "backup", "--accept", "*.json", "https://flathub.org/stats/"]) != 0:
    exit(1)

files = []
refs = {}

for (dirpath, _, filenames) in os.walk("stats"):
    files.extend(os.path.join(dirpath, filename) for filename in filenames)
files.sort()
# The latest stats aren't very accurate, please see: https://github.com/klausenbusk/flathub-stats/issues/5
del files[-1]

for f in files:
    print(f)
    with open(f) as json_file:
        data = json.load(json_file)
        date = data["date"]
        for ref in data["refs"]:
            refs.setdefault(ref, {"ref": ref, "stats": []})["stats"].append({"date": date, "arches": data["refs"][ref]})


os.chdir("web")
if os.path.isdir("data"):
    shutil.rmtree("data")
os.mkdir("data")

def writeJson(f, data):
    with open(f, "w") as outfile:
        json.dump(data, outfile)

for ref in refs:
    writeJson(f"data/{ref.replace('/', '_')}.json", refs[ref])

writeJson("data/refs.json", list(refs.keys()))
