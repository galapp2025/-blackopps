# Election Enrichment Engine

מנוע העשרת בוחרים לקמפיין בחירות — FastAPI, PostgreSQL, Redis, Celery ו-Next.js.

## מבנה הפרויקט

```text
election-enrichment-engine/
├── backend/
│   ├── app/
│   │   ├── main.py          # נקודת הכניסה של ה-API
│   │   ├── config.py        # הגדרות מערכת ומשתני סביבה
│   │   ├── database.py      # חיבור ל-PostgreSQL וניהול Sessions
│   │   ├── models.py        # הגדרת טבלאות ה-DB (הבוחרים וההעשרות)
│   │   ├── schemas.py       # אימות נתונים קשוח (Pydantic)
│   │   ├── tasks.py         # 24 סוכני ההעשרה של Celery
│   │   └── predictive.py    # מנוע החיזוי הסטטיסטי (הסיגמואיד)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # אפליקציית Next.js
└── docker-compose.yml       # הרמת PostgreSQL, Redis ו-Celery במכה אחת
```

## הרצה עם Docker

```bash
cp .env.example .env
docker compose up --build
```

שירותים:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

## הרצה מקומית (ללא Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

בטרמינל נוסף:

```bash
cd backend
source .venv/bin/activate
celery -A app.tasks.celery_app worker --loglevel=info
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API עיקרי

- `GET /health` — בדיקת תקינות
- `GET /agents` — רשימת 24 סוכני ההעשרה
- `GET /voters` — רשימת בוחרים
- `POST /voters` — יצירת בוחר
- `GET /voters/{id}` — פרטי בוחר + העשרות
- `POST /voters/{id}/enrich` — הפעלת סוכני העשרה
- `POST /predict` — חיזוי סיגמואיד על בסיס features

## 24 סוכני העשרה

כל סוכן הוא משימת Celery עצמאית: דמוגרפיה, גיאוגרפיה, אימות קשר, היסטוריית הצבעה, חיזוי הגעה, ועוד.

הסוכן `predictive_turnout` משתמש במנוע הסיגמואיד ב-`predictive.py` כדי לחשב `turnout_score` לכל בוחר.
