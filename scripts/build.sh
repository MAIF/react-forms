#!/usr/bin/env bash

LOCATION=`pwd`

build () {
  cd $LOCATION
  yarn install
  yarn build
}

publish () {
  TAG_NAME=`git describe --tags`
  echo "Publishing npm packages for tag ${TAG_NAME}"

  PACKAGE_VERSION=$(echo "${TAG_NAME}" | cut -d "v" -f 2)
  cd ${LOCATION}
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >>.npmrc

  echo "Setting version to ${PACKAGE_VERSION}"
  npm version ${PACKAGE_VERSION}
  echo 'Publishing'
  npm publish
}

case "${1}" in
  github)
    build
    publish
    ;;
  *)
    echo "bad params"
esac

exit ${?}