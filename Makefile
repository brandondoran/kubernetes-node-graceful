APP_NAME := k8s-node-graceful
DOCKER_REPO := brandondoran

# make VERSION=1.2.3 build
build: ## Build the container
	docker build -t $(DOCKER_REPO)/$(APP_NAME):$(VERSION) .

# make VERSION=1.2.3 publish
publish: ## publish the `{version}` taged image
	@echo 'publish $(VERSION)'
	docker push $(DOCKER_REPO)/$(APP_NAME):$(VERSION)

# make VERSION=1.2.3 release
# Docker release - build, tag and push the container
release: build publish ## Make a release by building and publishing the `{version}` tagged image to DockerHub
