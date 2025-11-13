#          jenkins安装

```
# 安装 Java 17（如果尚未安装）
sudo dnf install -y java-17-openjdk-devel

# 确认 Java 安装路径
JAVA_PATH=$(dirname $(readlink -f $(which java)))
echo "Java 安装路径: $JAVA_PATH"

# 创建 Jenkins 目录
mkdir -p /opt/jenkins/{home,war,logs}
cd /opt/jenkins/war

# 如果已经有 jenkins.war，复制到目录
cp /tmp/jenkins.war /opt/jenkins/war/

# 获取 Java 实际安装路径（更可靠的方法）
JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))

# 创建 systemd 服务文件（注意替换为时机JAVA_HOME地址）
cat > /etc/systemd/system/jenkins.service << EOF
[Unit]
Description=Jenkins Continuous Integration Server
After=network.target

[Service]
Type=simple
User=root
Environment="JAVA_HOME=$JAVA_HOME"
Environment="JENKINS_HOME=/opt/jenkins/home"
ExecStart=$JAVA_HOME/bin/java -jar /opt/jenkins/war/jenkins.war --httpPort=8080
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
StandardOutput=journal
StandardError=journal
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
EOF

# 设置目录权限
chmod 755 /opt/jenkins /opt/jenkins/{home,war,logs}
chmod 644 /opt/jenkins/war/jenkins.war

# 重新加载 systemd
systemctl daemon-reload

# 启用开机自启
systemctl enable jenkins

# 启动 Jenkins
systemctl start jenkins

# 等待几秒让服务启动
sleep 10

# 查看状态
systemctl status jenkins

# 开放 Jenkins 端口
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --reload

# 验证端口监听
ss -tulpn | grep 8080

# 获取管理员密码（使用正确的路径）
echo "管理员密码文件位于: /opt/jenkins/home/secrets/initialAdminPassword"
cat /opt/jenkins/home/secrets/initialAdminPassword
```



### 安装GIT

```
dnf install -y git

# 验证安装
git --version
```