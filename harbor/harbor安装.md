# harbor安装

### 防火墙配置

```
# 开放 HTTP 端口
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp  # 如果使用HTTPS

# 重新加载防火墙
sudo firewall-cmd --reload
```

## 安装 Docker 和 Docker Compose

### 步骤 1: 安装 Docker

```
# 安装依赖
sudo dnf install -y yum-utils device-mapper-persistent-data lvm2

# 添加 Docker 官方仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io

# 启动并启用 Docker
systemctl start docker
systemctl enable docker
```

### 步骤 2: 安装 Docker Compose

```
# 下载 Docker Compose（请检查最新版本）
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 创建符号链接
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 验证安装
docker-compose --version
```

### 步骤 1: 准备安装环境

```
# 创建 Harbor 安装目录
sudo mkdir -p /opt/harbor
cd /opt/harbor

# 复制您的 Harbor 安装包到该目录
cp /path/to/harbor-offline-installer-v2.0.6.tgz /opt/harbor/

# 解压安装包
sudo tar xzf harbor-offline-installer-v2.0.6.tgz

# 进入解压后的目录
cd harbor
```

### 步骤 2: 配置 Harbor

```
# 复制配置文件模板
sudo cp harbor.yml.tmpl harbor.yml

# 编辑配置文件
sudo vim harbor.yml
```

**主要配置项修改**：

```
# 主机名 - 修改为您的域名或IP地址
hostname: your-server-ip-or-domain.com

# HTTP 配置（如果不用HTTPS）
http:
  port: 80

# HTTPS 配置（如果需要HTTPS，取消注释并修改）
# https:
#   port: 443
#   certificate: /your/certificate/path
#   private_key: /your/private/key/path

# Harbor 管理员密码
harbor_admin_password: Harbor12345

# 数据库密码
database:
  password: root123
  max_idle_conns: 50
  max_open_conns: 1000

# 数据存储路径
data_volume: /data/harbor

# 日志配置
log:
  level: info
  local:
    rotate_count: 50
    rotate_size: 200M
    location: /var/log/harbor
```

### 步骤 3: 运行安装脚本

```
# 执行安装脚本
sudo ./install.sh
```

### 步骤 4: 验证安装

```
# 检查容器状态
docker ps

# 应该看到类似以下的容器运行：
# - harbor-core
# - harbor-portal
# - harbor-db
# - redis
# - registry
# - harbor-jobservice
# - harbor-log

# 检查服务状态
docker-compose ps
```

测试登录：

```
docker login 192.168.87.129:80 -u admin -p 密码

网页：http://192.168.87.129/
```

### 服务管理

```
# 进入 Harbor 目录
cd /opt/harbor/harbor

# 停止 Harbor
docker-compose down

# 启动 Harbor
docker-compose up -d

# 重启 Harbor
docker-compose restart

# 查看日志
docker-compose logs -f
```

### 备份和恢复

```
# 备份（在 Harbor 目录中）
sudo ./prepare
docker-compose down
sudo tar czf harbor-backup-$(date +%Y%m%d).tar.gz /data/harbor /opt/harbor/harbor
docker-compose up -d

# 恢复
tar xzf harbor-backup-YYYYMMDD.tar.gz -C /
cd /opt/harbor/harbor
docker-compose down
./prepare
docker-compose up -d
```