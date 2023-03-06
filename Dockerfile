FROM node

ARG PROJECT
WORKDIR /opt/${PROJECT}/p.org

COPY ./ /opt/${PROJECT}

RUN npm install
RUN npm completion >> /root/.bashrc

COPY docker-config/bashrc /root/.bashrc
COPY ./docker-config/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint"]
