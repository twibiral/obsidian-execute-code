/**
 * This script updates the version in manifest.json, package-lock.json, versions.json and CHANGELOG.md
 * with the version specified in the package.json.
 */

import {readFileSync, writeFileSync} from "fs";

// READ TARGET VERSION FROM NPM package.json
const targetVersion = process.env.npm_package_version;

// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const {minAppVersion} = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

let package_lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
package_lock.version = targetVersion;
manifest.version = targetVersion;
writeFileSync("package-lock.json", JSON.stringify(package_lock, null, "\t"));

// update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));

// Update version in CHANGELOG
const changelog = readFileSync("CHANGELOG.md", "utf8");
const newChangelog = changelog.replace(/^## \[Unreleased\]/m, `## [${targetVersion}]`);
writeFileSync("CHANGELOG.md", newChangelog);

console.log(`Updated version to ${targetVersion} and minAppVersion to ${minAppVersion} in manifest.json, versions.json and CHANGELOG.md`);
