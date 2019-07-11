#!/bin/bash
echo NODE=${NODE} > .env
yarn install
yarn run dev