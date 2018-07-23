FROM node:10.7.0-stretch

LABEL MAINTAINER="Casey Primozic <me@ameo.link>"

# RUN apt-get --no-cache add curl
RUN curl https://sh.rustup.rs -sSf | \
  sh -s -- -y --default-toolchain nightly

ADD . /app

WORKDIR /app/rust
RUN ~/.cargo/bin/cargo build --release

WORKDIR /app
RUN npm install

CMD ["sh", "./start.sh"]
