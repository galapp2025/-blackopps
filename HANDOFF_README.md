# BlackOpps — Handoff README (v5.0 FINAL V2)

## ללקוח / קמפיינר

1. היכנסו ל-https://blackopps.vercel.app
2. אם מתבקש מפתח API — הזינו את המפתח שסופק
3. התחילו מ-**בוחרים** (`/voters`) — זה מסך העבודה היומי
4. לחצו על שורה → תיק מודיעין (רשתות, עמדות, טריגרים, איך לפנות)
5. מתוך הפאנל: צרו מסר / וואטסאפ / הוסיפו לקמפיין

## לצוות טכני

| רכיב | נתיב |
|------|------|
| Backend | `predator-agent/backend/app/` |
| Deep Intel | `intelligence/voter_intel_deep.py` |
| Frontend | `election-enrichment-engine/frontend/` |
| Voters UI | `components/voters/VoterDeepDive.tsx` |

### Deploy

```bash
# Backend
cd predator-agent && git push origin main
# אם Railway לא מתעדכן אוטומטית:
railway up --detach

# Frontend
cd election-enrichment-engine && git push origin main
# Vercel auto-deploy
```

### Smoke

```bash
curl -s https://blackopps-api-production.up.railway.app/health | python3 -m json.tool
curl -s -X POST https://blackopps-api-production.up.railway.app/api/intel/voter/deep-profile \
  -H 'Content-Type: application/json' -d '{"voter_id":"3306"}' | head -c 400
```

## הערות

- שליחת WhatsApp אמיתית דורשת WhatsApp Business API (כפתור Send מושבת עם הסבר)
- נתוני דמה אסורים — הכל מ-DB / Groq עם fallback כנה על פערי מודיעין
