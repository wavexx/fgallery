# Latest version of ubuntu
FROM ubuntu:devel

# Default git repository
ENV GIT_REPOSITORY https://github.com/wavexx/fgallery.git
ENV GIT_REPOSITORY_FACEDETECT https://github.com/wavexx/facedetect/

# Innstall apps + tools
RUN apt-get update \
    && apt-get install --no-install-recommends -y ca-certificates exiftran git imagemagick libimage-exiftool-perl liblcms2-utils opencv-data perl python3 python3-numpy python3-opencv zip \
    && git clone $GIT_REPOSITORY \
    && git clone $GIT_REPOSITORY_FACEDETECT \
    && mv facedetect/facedetect /usr/local/bin/ \
    && rm -rf /facedetect \
    && apt-get -y purge ca-certificates git \
    && apt-get clean

VOLUME /mnt

WORKDIR /mnt

ENTRYPOINT ["perl", "/fgallery/fgallery"]
