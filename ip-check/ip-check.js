/**
 * 节点落地 IP 查询
 * 类型: generic — 长按节点时触发
 *
 * [script]
 * generic script-path=ip-check.js, tag=节点IP查询, timeout=20, img-url=location.fill.viewfinder.system
 */

var nodeName = $environment.params.node;
var nodeInfo  = $environment.params.nodeInfo || {};

var FLAGS = {
  CN:"🇨🇳", HK:"🇭🇰", TW:"🇨🇳", JP:"🇯🇵", KR:"🇰🇷",
  SG:"🇸🇬", US:"🇺🇸", GB:"🇬🇧", UK:"🇬🇧", DE:"🇩🇪",
  FR:"🇫🇷", NL:"🇳🇱", CA:"🇨🇦", AU:"🇦🇺", RU:"🇷🇺",
  IN:"🇮🇳", TR:"🇹🇷", BR:"🇧🇷", TH:"🇹🇭", MY:"🇲🇾",
  PH:"🇵🇭", ID:"🇮🇩", VN:"🇻🇳",
};

function getFlag(code) {
  if (!code) return "";
  return FLAGS[code.toUpperCase()] || code.toUpperCase();
}

function buildHTML(ip, country, code, region, org) {
  var flag = getFlag(code);
  var rows = "";
  rows += "<b>🌐 落地 IP</b>　" + ip + "<br/>";
  if (country) rows += "<b>🗺 国家</b>　　" + flag + " " + country + "<br/>";
  if (region)  rows += "<b>📍 地区</b>　　" + region + "<br/>";
  if (org)     rows += "<b>🏢 ISP</b>　　 " + org + "<br/>";
  rows += "<b>📡 节点</b>　　" + nodeName + "<br/>";
  if (nodeInfo.address) rows += "<b>🔗 入口</b>　　" + nodeInfo.address + ":" + (nodeInfo.port || "") + "<br/>";
  if (nodeInfo.type)    rows += "<b>⚙️ 协议</b>　　" + nodeInfo.type + "<br/>";
  return '<p style="text-align:center;font-family:-apple-system;font-size:medium;line-height:1.8;">' + rows + '</p>';
}

function buildErrorHTML() {
  return '<p style="text-align:center;font-family:-apple-system;font-size:large;"><b>🛑 查询失败</b><br/>节点无响应或连接超时</p>';
}

// 依次尝试多个 API，任一成功即返回结果
var apis = [
  "https://api.ip.sb/geoip",
  "https://ipinfo.io/json",
  "https://ipapi.co/json/"
];
var apiIndex = 0;

function tryNextAPI() {
  if (apiIndex >= apis.length) {
    // 全部失败
    $done({ title: "❓ " + nodeName, htmlMessage: buildErrorHTML() });
    return;
  }

  var url = apis[apiIndex];
  apiIndex++;

  $httpClient.get(
    { url: url, node: nodeName, headers: { "User-Agent": "Mozilla/5.0" }, timeout: 8000 },
    function(error, response, data) {
      if (error || !data) {
        tryNextAPI();
        return;
      }
      var res;
      try { res = JSON.parse(data); } catch(e) { tryNextAPI(); return; }
      if (!res || !res.ip) { tryNextAPI(); return; }

      var ip      = res.ip || "";
      var country = res.country_name  || res.country  || "";
      var code    = res.country_code  || res.country  || "";
      var region  = res.region        || res.city     || "";
      var org     = res.org           || res.organization || res.asn || "";
      var flag    = getFlag(code);

      $done({
        title: flag + " " + nodeName,
        htmlMessage: buildHTML(ip, country, code, region, org)
      });
    }
  );
}

tryNextAPI();
