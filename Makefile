PROJECT = $(shell basename $(shell pwd))
ID = pikesley/${PROJECT}

build:
	docker build \
		--build-arg PROJECT=${PROJECT} \
		--tag ${ID} .

run:
	docker run \
		--name ${PROJECT} \
		--hostname ${PROJECT} \
		--volume $(shell pwd):/opt/${PROJECT} \
		--interactive \
		--tty \
		--rm \
		--publish 3001:3001 \
		--publish 8080:8080 \
		${ID} \
		bash

exec:
	docker exec \
		--interactive \
		--tty \
		${PROJECT} \
		bash
