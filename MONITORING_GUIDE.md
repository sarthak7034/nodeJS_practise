# Prometheus & Grafana Monitoring Guide

Since `helm` is not installed, I have provided standard Kubernetes manifests to deploy the monitoring stack.

## 1. Update Application
First, rebuild your application because we added the `/metrics` endpoint.
```bash
docker build -t node-app .
# Restart the app deployment to pick up the new image
kubectl rollout restart deployment node-app
```

## 2. Deploy Monitoring Stack
Run the following to deploy Prometheus and Grafana:
```bash
kubectl apply -f k8s/monitoring/
```

## 3. Access Dashboards

### Prometheus
- **URL**: `http://localhost:9090` (if using Docker Desktop NodePort/LoadBalancer) or check `kubectl get services`.
- **Query**: Type `nodejs_version_info` or `process_cpu_seconds_total` to verify metrics are coming in.

### Grafana
- **URL**: `http://localhost:3001` (Mapped to 3001 to avoid conflict with your app on 3000).
- **Default Login**: `admin` / `admin` (You will be asked to change password, you can skip).

#### Setup Data Source
1.  Go to **Configuration (Gear Icon)** -> **Data Sources**.
2.  Click **Add data source**.
3.  Select **Prometheus**.
4.  **URL**: `http://prometheus:9090` (Internal Cluster DNS).
5.  Click **Save & Test**.

#### Create Dashboard
1.  Click **+** -> **Dashboard**.
2.  Add an Empty Panel.
3.  Metric query: `process_cpu_seconds_total` (just to test).

## Helm Chart
I have also created a Helm Chart for your application practice in `chart/node-app`.
Since you don't have Helm installed, you can inspect the structure to learn how industry-standard packaging works.
