## BUILDING
##   (from project root directory)
##   $ docker build -t wchiou1-wchiou1-github-io .
##
## RUNNING
##   $ docker run -p 9000:9000 wchiou1-wchiou1-github-io
##
## CONNECTING
##   Lookup the IP of your active docker host using:
##     $ docker-machine ip $(docker-machine active)
##   Connect to the container at DOCKER_IP:9000
##     replacing DOCKER_IP for the IP of your active docker host

FROM gcr.io/stacksmith-images/debian-buildpack:wheezy-r8

MAINTAINER Bitnami <containers@bitnami.com>

ENV STACKSMITH_STACK_ID="sm8wbww" \
    STACKSMITH_STACK_NAME="wchiou1/wchiou1.github.io" \
    STACKSMITH_STACK_PRIVATE="1"

RUN bitnami-pkg install php-7.0.9-0 --checksum 206d8b7698328dad514fc6c61c8560b652aa8846a404a3415ca0086772d6a032

ENV PATH=/opt/bitnami/php/bin:$PATH

## STACKSMITH-END: Modifications below this line will be unchanged when regenerating

# PHP base template
COPY . /app
WORKDIR /app

CMD ["php", "-a"]
