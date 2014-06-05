FROM ubuntu:12.04
MAINTAINER Erik Kristensen <erik@erikkristensen.com>

RUN sed 's/main$/main universe/' -i /etc/apt/sources.list
RUN apt-get update
RUN apt-get -y install python-software-properties build-essential git
RUN add-apt-repository -y ppa:chris-lea/node.js
RUN apt-get update
RUN apt-get -y install nodejs

WORKDIR /opt/app
ADD . /opt/app

ENV NODE_ENV docker

RUN npm install --production

EXPOSE 5100

ENTRYPOINT ["node"]

CMD ["app.js"]