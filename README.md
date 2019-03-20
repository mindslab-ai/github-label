# `github-label` tool.

This is a simple tool to manage github labels for several your projects.

## Install

Install  first.

```
git clone git@github.com:mindslab-ai/github-label
npm install
```

# How to use

## Overview

- Edit github token and organization.
- Edit label configurations.
- Apply
- If some modified, edit and apply again.

## Edit github-param.json

```
cp github-param.sample.json github-param.json
vi github-param.json
```

## Edit labels.json

```
cp labels.sample.json labels.json
vi labels.json
```

## Run

```
   $ node label.js
```
