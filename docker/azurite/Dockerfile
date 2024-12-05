FROM node:18.13.0-alpine@sha256:fda98168118e5a8f4269efca4101ee51dd5c75c0fe56d8eb6fad80455c2f5827 as builder

WORKDIR /opt/azurite

USER root

RUN apk update && apk upgrade && \
  apk add --no-cache bash git openssh

RUN git config --global --add safe.directory /opt/azurite

RUN git clone https://github.com/Azure/Azurite /opt/azurite && \
  git checkout legacy-master

USER root

RUN npm install

FROM node:18.13.0-alpine@sha256:fda98168118e5a8f4269efca4101ee51dd5c75c0fe56d8eb6fad80455c2f5827

COPY --from=builder /opt/azurite /opt/azurite

WORKDIR /opt/azurite

VOLUME /opt/azurite/folder

ENV executable azurite

CMD ["sh", "-c", "node bin/${executable} -l /opt/azurite/folder"]
