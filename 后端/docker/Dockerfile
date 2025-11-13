#添加依赖环境，前提是将Java8的Docker镜像从官方镜像仓库pull下来，然后上传到自己的Harbor私有仓库中
FROM 192.168.87.129/library/java:8
#指定镜像制作作者，可自己随意设置
MAINTAINER admin
#运行目录
VOLUME /tmp
#将本地的文件拷贝到容器，一般在项目的target目录下，要根据项目自己修改
ADD target/*jar app.jar
#启动容器后自动执行的命令
ENTRYPOINT [ "java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app.jar" ]
