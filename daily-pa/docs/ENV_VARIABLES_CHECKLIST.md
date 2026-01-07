# Vercel 环境变量快速清单 / Vercel Environment Variables Quick Checklist

## ❌ 必须删除 / Must Delete

```
NEXT_PUBLIC_DEV_SKIP_AUTH
```

## ✅ 必须添加 / Must Add

### 1. Supabase (2 个变量)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://qmpuasmglrkbnsymgaah.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_7IbnqO7JXVqr7kavaxoPEg_Zxh0kons
```

### 2. 站点 URL (1 个变量)

```bash
NEXT_PUBLIC_SITE_URL=https://daily-pa1.vercel.app
```

### 3. DeepSeek API (1 个变量)

```bash
DEEPSEEK_API_KEY=sk-f71c96e47d6b435cbfc35ebd357075b3
```

### 4. Google Cloud Vision (4 个变量)

```bash
GOOGLE_PROJECT_ID=gen-lang-client-0429021933
GOOGLE_PRIVATE_KEY_ID=7cdf4d138848ff5ec81d58f108ebdfe478442feb
GOOGLE_CLIENT_EMAIL=daily-pa@gen-lang-client-0429021933.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=106089833813432456279
```

```bash
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCMu+IsEcKxeBgi
cX/6qSzBarhHBE32tDuHR6KlBw3Dl2sjklIt0Rxn1LsF18H7dD8UNjdjdp4ToUmV
JoERGT9GMC0it9X5kgGudhaDOKiRNXv39kbbhrpiHcg1hpDG+L8nE0GHqJ5uDWLD
GZDQ6Z60ROAE0jHeWwekwp4xkoDskWlf2hynBO9TUouCY9DyculNeqXGfUDAzwg8
K0GP31slXMK9hBXbzaSHRDjgvK8RTvw92dAijhEc0hv29m1iQAa67fhA3ser1LKM
9oTrTj30LaTco/HkdH+G15/EYhWLdrbkB/URqilP7QOZvEny12kl1BiA/wx4w6gv
CsMq2+8TAgMBAAECggEARaZUrI/Lpc40T5ORjYn9cunwsoDwXtjbHzv2RCtGBhdh
uFSZpEA6CS8QsjcSM3LYJxYf+nNBj6CCjLTmKoKuvHtqUyTdWqsGdwPNZ3r6fgcU
x+bUMaAvjRCFPexPqZGA9QNEKrHqWrf4OWtlLud4Gmp93hTzBkNR+Joy9YC2mp0u
pdKFW6eVy7wB8eAkPkULucKgexHCId7ovLnfV7HPbhcvngkDVKdAz+3A/OPtkXlR
ApZBhLthz/nTKVVrFtnfsJ9uaKJUYnp5Eay0A97Zp4IHf478Om4HpBnfDcdDDuz5
xk5FlKyRbCVFNcv5U0leBtOAzlitcQJzAMoa42fl0QKBgQDEjVBM0fpniItPnM0N
7NHUsoPqKEuRugPdljKUl6ZvfHUMvdPRm81DKivAWuvSh8QbNNzN0NKiUSt+wb2h
nQ9HT/0f9Tw7rPrAemeu8t8h2A+3L1DMTj0UjInMAw3jvOHEzqkB07uTzhl70cLF
0/quV8jXop5aHQ9dCuLaPwD2kQKBgQC3TKuvuwztIi5aNc2Vn4V2qNQnCa5CMv07
4ZnRr8DMb8CRmWiElEbJ4Qsf6qrLcDAMaTIki+9GyK+dYl1A6d1gHKGRroW32HxE
6BWgybiruJM1O5XVxGtH9tC2drYmWl0THN1h4lCUpCSOLYGvqcpRNIUxUCYoQoTk
nYz76U/FYwKBgHZfGMY7C1BBBo1axI+nWTN8kz95JxHLcjqIE0w0DJNF5ARZanDp
IPRbOGAvIaj4BN3Rt0zof4Ir2kMLkRX8zc/H14zgl3blFVrIHRtav5DVW5maEFIK
qHRwsyg/iqTmAx4Qy+4Cwwwf6m8Mg/26TVWkHpvnHvDsYW1KehawLPdRAoGAAYE1
n5mvf3raWo86gtHubIzyQOfJcG2uuoEdnCUPNh5svEVAIGZ/NkUMrFRm1oizPEbY
zIgBjNk059vY3CGPWayifump21qBmqc1Fj7Rr0cynitBDaIxJ0QVbooG8MWpIfEI
uDb9Zlr6mdgxyllgec4ukbsQtR/mq2HHuIGvz/UCgYBtj4S37A4pIzdIqlDoBlCL
xwhPzrezRFbPiOFH+WxkL6KvR6KXLPO8aqAQuAbYM693EnwflIVz8ykPQbM4M9cy
znRUeXDC1BleJHWWS+WfGuJGbimn6MG3/IadZXHbJnPBTce1eiZGKwN9hYV4pZv6
hTOsHII9lMorAk73u9uw9w==
-----END PRIVATE KEY-----
```

---

## 📋 总计 / Total

- **删除**: 1 个变量
- **添加**: 8 个变量

---

## 🔗 快速链接 / Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **项目设置**: https://vercel.com/dashboard → 选择 `daily-pa1` → Settings → Environment Variables
- **部署 URL**: https://daily-pa1.vercel.app

---

## ⚡ 配置后操作 / After Configuration

1. ✅ 保存所有环境变量
2. ✅ 重新部署 (Redeploy)
3. ✅ 等待部署完成 (约 2-3 分钟)
4. ✅ 访问 https://daily-pa1.vercel.app
5. ✅ 测试登录功能
