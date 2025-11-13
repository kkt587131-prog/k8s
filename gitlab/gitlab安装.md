# gitlab安装

### 下载 GitLab RPM 包

```
# 对于 Rocky Linux 9 
dnf install -y wget 
wget https://packages.gitlab.com/gitlab/gitlab-ce/packages/el/9/gitlab-ce-17.4.0-ce.0.el9.x86_64.rpm/gitlab-ce.rpm
```

### 安装 GitLab 依赖

```
sudo dnf install -y curl policycoreutils-python-utils openssh-server postfix
sudo systemctl enable postfix
sudo systemctl start postfix
```

### 手动安装 GitLab RPM

```
dnf install -y ./gitlab-ce.rpm
# 或者使用 dnf 安装（会自动处理依赖）
sudo dnf install -y ./gitlab-ce.rpm
```

### 配置和启动 GitLab

```
# 编辑配置文件，设置外部URL
sudo vim /etc/gitlab/gitlab.toml
# 或者直接使用环境变量
sudo EXTERNAL_URL="http://192.168.87.137" gitlab-ctl reconfigure
```

###  配置防火墙

```
# 开放 HTTP 和 HTTPS 端口
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 手动启动 GitLab 服务（如果 reconfigure 没有自动启动）

```
# 启动所有 GitLab 服务
sudo gitlab-ctl start

# 或者重启服务确保所有组件正常启动
sudo gitlab-ctl restart
```

### 验证 GitLab 服务状态

```
# 检查所有 GitLab 服务状态
sudo gitlab-ctl status

# 应该看到类似以下服务都在运行：
# ✓ run: alertmanager: (pid 1234) 10s
# ✓ run: gitaly: (pid 1235) 10s  
# ✓ run: gitlab-exporter: (pid 1236) 10s
# ✓ run: gitlab-workhorse: (pid 1237) 10s
# ✓ run: logrotate: (pid 1238) 9s
# ✓ run: nginx: (pid 1239) 9s
# ✓ run: postgresql: (pid 1240) 8s
# ✓ run: prometheus: (pid 1241) 8s
# ✓ run: puma: (pid 1242) 7s
# ✓ run: redis: (pid 1243) 7s
# ✓ run: sidekiq: (pid 1244) 6s
```

### 验证开机自启

```
# 检查 GitLab 相关服务是否启用开机自启
sudo systemctl list-unit-files | grep gitlab

# 检查主要的 GitLab 服务状态
sudo systemctl status gitlab-runsvdir
```

### 开放80端口

```
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
```

### 获取初始 root 密码

```
# 查看初始 root 密码
sudo cat /etc/gitlab/initial_root_password
```

kCyvS478Cj3Jj3S