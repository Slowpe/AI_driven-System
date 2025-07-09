const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const IP_ADDRESSES = [
  '192.168.1.254', '10.0.0.5', '172.16.31.18', '203.0.113.199', '8.8.8.8',
  '1.1.1.1', '91.198.174.192', '198.51.100.42', '197.210.65.10', '102.89.33.25'
];

const APACHE_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
const APACHE_PATHS = ['/login.php', '/admin/index.html', '/api/v1/users', '/assets/style.css', '/uploads/image.jpg'];
const APACHE_STATUS = ['200', '404', '500', '403', '301'];

const HDFS_ACTIONS = ['read', 'write', 'delete', 'create'];
const HDFS_FILES = ['/user/data/file.dat', '/tmp/temp_log.txt', '/system/config.xml'];

const FIREWALL_ACTIONS = ['ALLOW', 'DENY'];
const FIREWALL_PROTOCOLS = ['TCP', 'UDP', 'ICMP'];

export const ANOMALIES = {
  critical: { label: '⚠ Unauthorized Access Attempt', color: 'text-red-500' },
  high: { label: 'DDoS Spike Detected', color: 'text-orange-400' },
  medium: { label: 'Suspicious Port Scan', color: 'text-yellow-500' },
  low: { label: 'Multiple Failed Logins', color: 'text-yellow-300' },
};

const generateApacheLog = () => {
  const ip = randomFrom(IP_ADDRESSES);
  const method = randomFrom(APACHE_METHODS);
  const path = randomFrom(APACHE_PATHS);
  const status = randomFrom(APACHE_STATUS);
  const bytes = Math.floor(Math.random() * 5000);
  return `${ip} - - [${new Date().toLocaleString()}] "${method} ${path} HTTP/1.1" ${status} ${bytes}`;
};

const generateHdfsLog = () => {
  const action = randomFrom(HDFS_ACTIONS);
  const file = randomFrom(HDFS_FILES);
  const user = 'hadoop';
  const ip = randomFrom(IP_ADDRESSES);
  return `INFO HDFS.Audit: user=${user} ip=${ip} cmd=${action} src=${file} dst=null perm=null`;
};

const generateFirewallLog = () => {
  const action = randomFrom(FIREWALL_ACTIONS);
  const protocol = randomFrom(FIREWALL_PROTOCOLS);
  const srcIp = randomFrom(IP_ADDRESSES);
  const dstIp = randomFrom(IP_ADDRESSES);
  const srcPort = Math.floor(Math.random() * 65535) + 1;
  const dstPort = randomFrom([80, 443, 22, 3389, 8080]);
  return `Firewall: ${action} ${protocol} from ${srcIp}:${srcPort} to ${dstIp}:${dstPort}`;
};

const logGenerators = [generateApacheLog, generateHdfsLog, generateFirewallLog];

export const generateLogEntry = (id) => {
  const logGenerator = randomFrom(logGenerators);
  const message = logGenerator();
  const timestamp = new Date();
  
  let anomaly = null;
  const anomalyChance = Math.random();
  if (anomalyChance > 0.98) {
    anomaly = ANOMALIES.critical;
  } else if (anomalyChance > 0.95) {
    anomaly = ANOMALIES.high;
  } else if (anomalyChance > 0.90) {
    anomaly = ANOMALIES.medium;
  } else if (anomalyChance > 0.85) {
    anomaly = ANOMALIES.low;
  }

  return {
    id,
    timestamp,
    message,
    anomaly,
  };
};

export const generateMockLogs = (count) => {
  const logs = [];
  for (let i = 0; i < count; i++) {
    logs.push(generateLogEntry(i));
  }
  return logs;
};