FROM node

ARG PROJECT
WORKDIR /opt/${PROJECT}/p.org

RUN apt-get update && apt-get install -y nginx vim
COPY ./nginx/default /etc/nginx/sites-enabled/default

COPY ./ /opt/${PROJECT}

RUN npm install
RUN npm completion >> /root/.bashrc

COPY docker-config/bashrc /root/.bashrc
COPY ./docker-config/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint"]
