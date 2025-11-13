# k8s集群

### 安装准备

```
# 所有节点执行 - 基础环境准备
dnf update -y
dnf install -y curl wget vim net-tools telnet bash-completion chrony

#所有节点执行 - 时间同步
systemctl enable chronyd && systemctl start chronyd
chronyc sources -v

# 关闭交换内存
swapoff -a
sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

# 关闭 SELinux（可选，但可避免很多权限问题）
setenforce 0
sed -i 's/^SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config
```

### 1.防火墙配置（记得改IP）
```
# Master 节点 - 更精确的防火墙规则
# 只对 Node 节点开放必要的 API Server 端口
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.87.0/24" port port="6443" protocol="tcp" accept'

# Master 节点 - 其他控制平面组件只对本机开放
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.87.131" port port="2379-2380" protocol="tcp" accept'
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.87.131" port port="10257-10259" protocol="tcp" accept'

# 所有节点都需要
firewall-cmd --permanent --add-port=10250/tcp
firewall-cmd --permanent --add-port=30000-32767/tcp

firewall-cmd --reload
```



### 2.配置主机名和 hosts

```
# 在 k8s-master (192.168.87.131)
hostnamectl set-hostname k8s-master

# 在 k8s-node1 (192.168.87.133)
hostnamectl set-hostname k8s-node1

# 在 k8s-node2 (192.168.87.134)
hostnamectl set-hostname k8s-node2

# 所有节点都执行
cat >> /etc/hosts << EOF
192.168.87.131 k8s-master
192.168.87.133 k8s-node1
192.168.87.134 k8s-node2
EOF

# 验证
ping -c 2 k8s-master
ping -c 2 k8s-node1
ping -c 2 k8s-node2

source /etc/profile
```

### 3.配置内核，不配置pod直接无法通信（所有节点都执行）

```
# 加载内核模块
cat > /etc/modules-load.d/k8s.conf << EOF
overlay
br_netfilter
EOF

modprobe overlay
modprobe br_netfilter

# 验证模块加载
lsmod | grep overlay
lsmod | grep br_netfilter

# 配置内核参数
cat > /etc/sysctl.d/k8s.conf << EOF
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

# 使配置生效
sysctl --system

# 验证
sysctl -a | grep "net.bridge.bridge-nf-call-iptables"
sysctl -a | grep "net.ipv4.ip_forward"
```

### 4.安装 kubeadm、kubelet、kubectl(所有节点都执行)

```
# 添加 Kubernetes 仓库（阿里云）
cat > /etc/yum.repos.d/kubernetes.repo << EOF
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=0
repo_gpgcheck=0
EOF

# 安装 K8s 组件（指定版本 1.28.0）
dnf install -y kubelet-1.28.0 kubeadm-1.28.0 kubectl-1.28.0

# 启动 kubelet
systemctl enable kubelet
systemctl start kubelet

# 验证
kubeadm version
kubelet --version
kubectl version --client
```

### 5.安装 containerd

```
# 添加 Docker 仓库
dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
# 所有节点执行
dnf install -y containerd

# 生成配置
mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml

# 启用 systemd cgroup 驱动和修改沙箱镜像
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sed -i 's|registry.k8s.io/pause:3.8|registry.aliyuncs.com/google_containers/pause:3.9|g' /etc/containerd/config.toml

# 重启 containerd
systemctl daemon-reload
systemctl enable containerd
systemctl start containerd

# 验证
ctr version
```

### 6.初始化主节点(k8s-master)

###### 修改kubeadm-config.yaml内的advertiseAddress和controlPlaneEndpoint

```
kubeadm init --config kubeadm-config.yaml
```

```
# 创建HOME
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config

# 验证
kubectl get nodes

# 应该看到 master 节点，状态为 NotReady（因为还没安装网络插件）
kubectl get cs   #查看组件状态
```

### 7. 安装网络插件

```
# 使用特定版本的 Calico（更稳定）
curl -L https://raw.githubusercontent.com/projectcalico/calico/v3.26.4/manifests/calico.yaml -o calico.yaml

# 应用 Calico
kubectl apply -f calico.yaml

# 等待并验证
kubectl get pods -n kube-system -w
kubectl get nodes   #此时 master 节点应该变为 Ready
```

### 8.其他node节点加入主节点：

```
# 在 node 节点执行 join 命令
kubeadm join 192.168.87.131:6443 --token xxx --discovery-token-ca-cert-hash sha256:xxx

# 在 master 验证
kubectl get nodes -o wide

# 测试集群
kubectl create deployment nginx --image=nginx:alpine
kubectl expose deployment nginx --port=80 --type=NodePort
kubectl get svc,pods
```

### 9.创建Kubernetes Secret私有仓库（主节点master）

```
kubectl -n default create secret docker-registry harbor-registry --docker-email=baidu.com@example --docker-username=root --docker-password=root123456 --docker-server=192.168.87.129	

kubectl get secret harbor-registry #查看secret
```

### 10.Containerd 配置 HTTP 私有仓库（所有节点）

```
vim /etc/containerd/config.toml


#修改以下内容
[plugins."io.containerd.grpc.v1.cri".image_decryption]
  key_model = "node"

[plugins."io.containerd.grpc.v1.cri".registry]
  config_path = ""

  [plugins."io.containerd.grpc.v1.cri".registry.auths]

  [plugins."io.containerd.grpc.v1.cri".registry.configs]
    # ========== 在这里添加 Harbor TLS 配置 ==========
    [plugins."io.containerd.grpc.v1.cri".registry.configs."192.168.87.129".tls]
      insecure_skip_verify = true
    # 添加认证信息（如果需要）
    [plugins."io.containerd.grpc.v1.cri".registry.configs."192.168.87.129".auth]
      username = "admin"
      password = "root12345"

  [plugins."io.containerd.grpc.v1.cri".registry.headers]

  [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
    # ========== 在这里添加 Harbor 镜像端点 ==========
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."192.168.87.129"]
      endpoint = ["http://192.168.87.129"]

[plugins."io.containerd.grpc.v1.cri".x509_key_pair_streaming]
  tls_cert_file = ""
  tls_key_file = ""



#重启
systemctl restart containerd
systemctl status containerd  # 检查状态
```



### 11.遇到报错：

```
Here is one example how you may list all Kubernetes containers running in docker:
                - 'docker ps -a | grep kube | grep -v pause'
                Once you have found the failing container, you can inspect its logs with:
                - 'docker logs CONTAINERID'

error execution phase wait-control-plane: couldn't initialize a Kubernetes cluster
To see the stack trace of this error execute with --v=5 or higher

# 解决
rm -rf /etc/containerd/config.toml
systemctl restart containerd

# 如果初始化失败，可以重新初始化
kubeadm reset
```



