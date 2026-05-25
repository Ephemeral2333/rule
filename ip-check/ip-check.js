/**
 * 节点落地 IP 查询
 * 类型: generic — 长按节点时触发
 * $environment.params.node     → 被长按的节点名称
 * $environment.params.nodeInfo → 节点简洁信息 { name, address, port, type, tls }
 * 请求中指定 node 字段 → 强制让该请求走被长按的节点出去，拿到落地IP
 */

const APIS = [
  "https://api.ip.sb/geoip",
  "https://ipinfo.io/json",
  "https://ipapi.co/json/"
];

const nodeName = $environment.params.node;
const nodeInfo = $environment.params.nodeInfo || {};

const FLAGS = new Map([
  ["CN","🇨🇳"],["HK","🇭🇰"],["TW","🇨🇳"],["JP","🇯🇵"],["KR","🇰🇷"],
  ["SG","🇸🇬"],["US","🇺🇸"],["UK","🇬🇧"],["GB","🇬🇧"],["DE","🇩🇪"],
  ["FR","🇫🇷"],["NL","🇳🇱"],["CA","🇨🇦"],["AU","🇦🇺"],["RU","🇷🇺"],
  ["IN","🇮🇳"],["TR","🇹🇷"],["BR","🇧🇷"],["AR","🇦🇷"],["MX","🇲🇽"],
  ["TH","🇹🇭"],["MY","🇲🇾"],["PH","🇵🇭"],["ID","🇮🇩"],["VN","🇻🇳"],
]);

function getFlag(code) {
  if (!code) return "";
  return FLAGS.get(code.toUpperCase()) || code.toUpperCase();
}

function httpGet(url, node) {
  return new Promise((resolve) => {
    $httpClient.get(
      { url, node, headers: { "User-Agent": "Mozilla/5.0" }, timeout: 8000 },
      (error, response, data) => {
        if (error || !data) { resolve(null); return; }
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      }
    );
  });
}

async function queryLandingIP() {
  for (const url of APIS) {
    const res = await httpGet(url, nodeName);
    if (res && res.ip) {
      return {
        ip:      res.ip,
        country: res.country_name || res.country || "",
        code:    res.country_code  || res.country || "",
        region:  res.region        || res.city    || "",
        org:     res.org           || res.organization || res.asn || "",
      };
    }
  }
  return null;
}

function buildHTML(info) {
  if (!info) {
    return `<p style="text-align:center;font-family:-apple-system;font-size:large;">
      <b>🛑 查询失败</b><br/>节点无响应或连接超时
    </p>`;
  }

  const flag    = getFlag(info.code);
  const country = info.country ? `${flag} ${info.country}` : flag;
  const region  = info.region  ? `📍 ${info.region}`  : "";
  const org     = info.org     ? `🏢 ${info.org}`     : "";

  const rows = [
    `<b>🌐 落地 IP</b>　${info.ip}`,
    country ? `<b>🗺 国家</b>　　${country}` : "",
    region  ? `<b>📍 地区</b>　　${info.region}` : "",
    org     ? `<b>🏢 ISP</b>　　 ${info.org}` : "",
    `<b>📡 节点</b>　　${nodeName}`,
    nodeInfo.address ? `<b>🔗 入口</b>　　${nodeInfo.address}:${nodeInfo.port || ""}` : "",
    nodeInfo.type    ? `<b>⚙️ 协议</b>　　${nodeInfo.type}` : "",
  ].filter(Boolean).join("<br/>");

  return `<p style="text-align:center;font-family:-apple-system;font-size:medium;line-height:1.8;">
    ${rows}
  </p>`;
}

(async () => {
  const info = await queryLandingIP();
  const flag = info ? getFlag(info.code) : "❓";

  $done({
    title: `${flag} ${nodeName}`,
    htmlMessage: buildHTML(info),
  });
})();
