Now let me create all backend and frontend files in parallel:
Action: file_editor create /app/backend/server.py --file-text "from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta, date
from typing import List, Optional
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# Mongo
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = \"HS256\"

def get_jwt_secret() -> str:
    return os.environ[\"JWT_SECRET\"]

def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(\"utf-8\"), bcrypt.gensalt()).decode(\"utf-8\")

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(\"utf-8\"), h.encode(\"utf-8\"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    payload = {\"sub\": user_id, \"email\": email,
               \"exp\": datetime.now(timezone.utc) + timedelta(minutes=60 * 24 * 7),
               \"type\": \"access\"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access: str):
    response.set_cookie(key=\"access_token\", value=access, httponly=True,
                       secure=False, samesite=\"lax\", max_age=60 * 60 * 24 * 7, path=\"/\")

# Models
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    onboarded: bool = False

class Subject(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    chapters: List[str] = []
    previous_marks: Optional[float] = None

class ProfileSetup(BaseModel):
    subjects: List[Subject]
    target_score: float = Field(ge=0, le=100)
    exam_date: str  # ISO date

class DailyLogIn(BaseModel):
    subject_id: str
    time_minutes: int = Field(ge=0)
    topics: str = \"\"
    rating: str  # 'revise_again' | 'need_more_time' | 'perfect'
    log_date: Optional[str] = None  # YYYY-MM-DD

class DailyLogOut(BaseModel):
    id: str
    subject_id: str
    subject_name: str
    time_minutes: int
    topics: str
    rating: str
    log_date: str
    created_at: str

# Auth dep
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get(\"access_token\")
    if not token:
        auth = request.headers.get(\"Authorization\", \"\")
        if auth.startswith(\"Bearer \"):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail=\"Not authenticated\")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get(\"type\") != \"access\":
            raise HTTPException(status_code=401, detail=\"Invalid token\")
        user = await db.users.find_one({\"id\": payload[\"sub\"]}, {\"_id\": 0, \"password_hash\": 0})
        if not user:
            raise HTTPException(status_code=401, detail=\"User not found\")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail=\"Token expired\")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail=\"Invalid token\")

# App
app = FastAPI(title=\"StudyPulse API\")
api = APIRouter(prefix=\"/api\")

# Auth
@api.post(\"/auth/register\", response_model=UserOut)
async def register(payload: RegisterRequest, response: Response):
    email = payload.email.lower().strip()
    if await db.users.find_one({\"email\": email}):
        raise HTTPException(status_code=400, detail=\"Email already registered\")
    user_id = str(uuid.uuid4())
    user_doc = {
        \"id\": user_id,
        \"email\": email,
        \"name\": payload.name.strip(),
        \"password_hash\": hash_password(payload.password),
        \"onboarded\": False,
        \"subjects\": [],
        \"target_score\": None,
        \"exam_date\": None,
        \"created_at\": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_id, email)
    set_auth_cookies(response, token)
    return UserOut(id=user_id, email=email, name=user_doc[\"name\"], onboarded=False)

@api.post(\"/auth/login\", response_model=UserOut)
async def login(payload: LoginRequest, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({\"email\": email})
    if not user or not verify_password(payload.password, user[\"password_hash\"]):
        raise HTTPException(status_code=401, detail=\"Invalid email or password\")
    token = create_access_token(user[\"id\"], email)
    set_auth_cookies(response, token)
    return UserOut(id=user[\"id\"], email=email, name=user[\"name\"], onboarded=user.get(\"onboarded\", False))

@api.post(\"/auth/logout\")
async def logout(response: Response):
    response.delete_cookie(\"access_token\", path=\"/\")
    return {\"ok\": True}

@api.get(\"/auth/me\", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return UserOut(id=user[\"id\"], email=user[\"email\"], name=user[\"name\"], onboarded=user.get(\"onboarded\", False))

# Profile / Onboarding
@api.get(\"/profile\")
async def get_profile(user=Depends(get_current_user)):
    return {
        \"id\": user[\"id\"],
        \"email\": user[\"email\"],
        \"name\": user[\"name\"],
        \"onboarded\": user.get(\"onboarded\", False),
        \"subjects\": user.get(\"subjects\", []),
        \"target_score\": user.get(\"target_score\"),
        \"exam_date\": user.get(\"exam_date\"),
    }

@api.put(\"/profile/setup\")
async def setup_profile(payload: ProfileSetup, user=Depends(get_current_user)):
    try:
        exam_dt = datetime.fromisoformat(payload.exam_date).date()
    except ValueError:
        raise HTTPException(status_code=400, detail=\"Invalid exam_date\")
    if exam_dt < date.today():
        raise HTTPException(status_code=400, detail=\"Exam date cannot be in the past\")
    if not payload.subjects:
        raise HTTPException(status_code=400, detail=\"At least one subject is required\")
    subjects = [s.model_dump() for s in payload.subjects]
    for s in subjects:
        if not s[\"id\"]:
            s[\"id\"] = str(uuid.uuid4())
        if s.get(\"previous_marks\") is not None and (s[\"previous_marks\"] < 0 or s[\"previous_marks\"] > 100):
            raise HTTPException(status_code=400, detail=f\"Invalid previous_marks for {s['name']}\")
    await db.users.update_one({\"id\": user[\"id\"]}, {\"$set\": {
        \"subjects\": subjects,
        \"target_score\": payload.target_score,
        \"exam_date\": payload.exam_date,
        \"onboarded\": True,
    }})
    return {\"ok\": True}

@api.post(\"/subjects\")
async def add_subject(subject: Subject, user=Depends(get_current_user)):
    s = subject.model_dump()
    if not s[\"id\"]:
        s[\"id\"] = str(uuid.uuid4())
    await db.users.update_one({\"id\": user[\"id\"]}, {\"$push\": {\"subjects\": s}})
    return s

@api.put(\"/subjects/{subject_id}\")
async def update_subject(subject_id: str, subject: Subject, user=Depends(get_current_user)):
    s = subject.model_dump()
    s[\"id\"] = subject_id
    await db.users.update_one(
        {\"id\": user[\"id\"], \"subjects.id\": subject_id},
        {\"$set\": {\"subjects.$\": s}}
    )
    return s

@api.delete(\"/subjects/{subject_id}\")
async def delete_subject(subject_id: str, user=Depends(get_current_user)):
    await db.users.update_one({\"id\": user[\"id\"]}, {\"$pull\": {\"subjects\": {\"id\": subject_id}}})
    return {\"ok\": True}

# Daily logs
def _subject_name(user, sid):
    for s in user.get(\"subjects\", []):
        if s[\"id\"] == sid:
            return s[\"name\"]
    return \"Unknown\"

@api.post(\"/logs\", response_model=DailyLogOut)
async def create_log(payload: DailyLogIn, user=Depends(get_current_user)):
    if payload.rating not in (\"revise_again\", \"need_more_time\", \"perfect\"):
        raise HTTPException(status_code=400, detail=\"Invalid rating\")
    if payload.time_minutes < 0:
        raise HTTPException(status_code=400, detail=\"Time cannot be negative\")
    log_date = payload.log_date or date.today().isoformat()
    try:
        datetime.fromisoformat(log_date)
    except ValueError:
        raise HTTPException(status_code=400, detail=\"Invalid log_date\")
    subject_name = _subject_name(user, payload.subject_id)
    if subject_name == \"Unknown\":
        raise HTTPException(status_code=400, detail=\"Subject not found\")
    doc = {
        \"id\": str(uuid.uuid4()),
        \"user_id\": user[\"id\"],
        \"subject_id\": payload.subject_id,
        \"subject_name\": subject_name,
        \"time_minutes\": payload.time_minutes,
        \"topics\": payload.topics,
        \"rating\": payload.rating,
        \"log_date\": log_date,
        \"created_at\": datetime.now(timezone.utc).isoformat(),
    }
    await db.logs.insert_one(doc)
    doc.pop(\"user_id\", None)
    return DailyLogOut(**doc)

@api.get(\"/logs\", response_model=List[DailyLogOut])
async def list_logs(days: int = 30, user=Depends(get_current_user)):
    since = (date.today() - timedelta(days=days)).isoformat()
    cursor = db.logs.find({\"user_id\": user[\"id\"], \"log_date\": {\"$gte\": since}}, {\"_id\": 0, \"user_id\": 0}).sort(\"log_date\", -1)
    items = await cursor.to_list(1000)
    return [DailyLogOut(**i) for i in items]

@api.delete(\"/logs/{log_id}\")
async def delete_log(log_id: str, user=Depends(get_current_user)):
    await db.logs.delete_one({\"id\": log_id, \"user_id\": user[\"id\"]})
    return {\"ok\": True}

# Analytics
@api.get(\"/analytics/daily\")
async def daily_analytics(days: int = 7, user=Depends(get_current_user)):
    since = (date.today() - timedelta(days=days - 1))
    cursor = db.logs.find({\"user_id\": user[\"id\"], \"log_date\": {\"$gte\": since.isoformat()}}, {\"_id\": 0, \"user_id\": 0})
    items = await cursor.to_list(5000)
    by_day = {}
    for d in range(days):
        k = (since + timedelta(days=d)).isoformat()
        by_day[k] = 0
    for it in items:
        if it[\"log_date\"] in by_day:
            by_day[it[\"log_date\"]] += it[\"time_minutes\"]
    return [{\"date\": k, \"minutes\": v} for k, v in sorted(by_day.items())]

@api.get(\"/analytics/weekly\")
async def weekly_analytics(user=Depends(get_current_user)):
    today = date.today()
    cur_start = today - timedelta(days=6)
    prev_start = today - timedelta(days=13)
    prev_end = today - timedelta(days=7)
    cursor = db.logs.find({\"user_id\": user[\"id\"], \"log_date\": {\"$gte\": prev_start.isoformat()}}, {\"_id\": 0, \"user_id\": 0})
    items = await cursor.to_list(5000)
    cur_total = 0
    prev_total = 0
    cur_topics = set()
    prev_topics = set()
    by_subject_cur = {}
    for it in items:
        d = date.fromisoformat(it[\"log_date\"])
        if cur_start <= d <= today:
            cur_total += it[\"time_minutes\"]
            if it[\"topics\"].strip():
                cur_topics.add(it[\"topics\"].strip().lower())
            by_subject_cur[it[\"subject_name\"]] = by_subject_cur.get(it[\"subject_name\"], 0) + it[\"time_minutes\"]
        elif prev_start <= d <= prev_end:
            prev_total += it[\"time_minutes\"]
            if it[\"topics\"].strip():
                prev_topics.add(it[\"topics\"].strip().lower())
    delta_pct = 0.0
    if prev_total > 0:
        delta_pct = round(((cur_total - prev_total) / prev_total) * 100, 1)
    elif cur_total > 0:
        delta_pct = 100.0
    return {
        \"current_week_minutes\": cur_total,
        \"previous_week_minutes\": prev_total,
        \"delta_pct\": delta_pct,
        \"current_week_topics_count\": len(cur_topics),
        \"previous_week_topics_count\": len(prev_topics),
        \"by_subject\": [{\"subject\": k, \"minutes\": v} for k, v in sorted(by_subject_cur.items(), key=lambda x: -x[1])],
    }

@api.get(\"/analytics/subjects\")
async def subjects_analytics(user=Depends(get_current_user)):
    cursor = db.logs.find({\"user_id\": user[\"id\"]}, {\"_id\": 0, \"user_id\": 0})
    items = await cursor.to_list(10000)
    out = {}
    for s in user.get(\"subjects\", []):
        out[s[\"id\"]] = {
            \"subject_id\": s[\"id\"],
            \"subject_name\": s[\"name\"],
            \"total_minutes\": 0,
            \"perfect\": 0,
            \"need_more_time\": 0,
            \"revise_again\": 0,
            \"logs_count\": 0,
            \"chapters_total\": len(s.get(\"chapters\", [])),
            \"completion_pct\": 0,
        }
    for it in items:
        sid = it[\"subject_id\"]
        if sid in out:
            out[sid][\"total_minutes\"] += it[\"time_minutes\"]
            out[sid][it[\"rating\"]] = out[sid].get(it[\"rating\"], 0) + 1
            out[sid][\"logs_count\"] += 1
    # Completion = unique topics covered / chapters_total (cap 100)
    for s in user.get(\"subjects\", []):
        sid = s[\"id\"]
        unique_topics = set()
        for it in items:
            if it[\"subject_id\"] == sid and it[\"topics\"].strip():
                for t in it[\"topics\"].split(\",\"):
                    t = t.strip().lower()
                    if t:
                        unique_topics.add(t)
        if out[sid][\"chapters_total\"] > 0:
            out[sid][\"completion_pct\"] = min(100, round(len(unique_topics) / out[sid][\"chapters_total\"] * 100))
    return list(out.values())

@api.get(\"/analytics/prediction\")
async def prediction(user=Depends(get_current_user)):
    if not user.get(\"exam_date\") or not user.get(\"target_score\"):
        return {\"available\": False, \"reason\": \"Setup not complete\"}
    exam_dt = datetime.fromisoformat(user[\"exam_date\"]).date()
    days_to_exam = (exam_dt - date.today()).days
    cursor = db.logs.find({\"user_id\": user[\"id\"]}, {\"_id\": 0, \"user_id\": 0})
    items = await cursor.to_list(10000)
    total_minutes = sum(i[\"time_minutes\"] for i in items)
    perfect = sum(1 for i in items if i[\"rating\"] == \"perfect\")
    need = sum(1 for i in items if i[\"rating\"] == \"need_more_time\")
    revise = sum(1 for i in items if i[\"rating\"] == \"revise_again\")
    total_logs = max(1, len(items))
    quality_score = (perfect * 1.0 + need * 0.6 + revise * 0.2) / total_logs  # 0..1

    chapters_total = sum(len(s.get(\"chapters\", [])) for s in user.get(\"subjects\", []))
    unique_topics = set()
    for it in items:
        if it[\"topics\"].strip():
            for t in it[\"topics\"].split(\",\"):
                t = t.strip().lower()
                if t:
                    unique_topics.add(t)
    completion = (len(unique_topics) / chapters_total) if chapters_total > 0 else 0
    completion = min(1.0, completion)

    # Hours benchmark: 50 hours of study = ideal
    hours = total_minutes / 60.0
    hours_norm = min(1.0, hours / 50.0)

    prev_avg = 0
    prev_count = 0
    for s in user.get(\"subjects\", []):
        if s.get(\"previous_marks\") is not None:
            prev_avg += s[\"previous_marks\"]
            prev_count += 1
    prev_norm = (prev_avg / prev_count / 100.0) if prev_count > 0 else 0.5

    # Weighted formula
    readiness = (0.35 * completion + 0.30 * quality_score + 0.20 * hours_norm + 0.15 * prev_norm)
    target = user[\"target_score\"]
    expected_score = round(readness * 100, 1)
    return {
        \"available\": True,
        \"show_panel\": days_to_exam <= 5,
        \"days_to_exam\": days_to_exam,
        \"readiness_pct\": round(readiness * 100, 1),
        \"expected_score\": expected_score,
        \"target_score\": target,
        \"completion_pct\": round(completion * 100, 1),
        \"quality_pct\": round(quality_score * 100, 1),
        \"hours_studied\": round(hours, 1),
    }

@api.get(\"/analytics/feedback\")
async def feedback(user=Depends(get_current_user)):
    today = date.today()
    yesterday = (today - timedelta(days=1)).isoformat()
    today_iso = today.isoformat()
    cursor = db.logs.find({\"user_id\": user[\"id\"], \"log_date\": {\"$in\": [yesterday, today_iso]}}, {\"_id\": 0, \"user_id\": 0})
    recent = await cursor.to_list(1000)
    logged_today = any(i[\"log_date\"] == today_iso for i in recent)
    logged_yesterday = any(i[\"log_date\"] == yesterday for i in recent)

    # Topics needing revision (recent revise_again)
    revise_cursor = db.logs.find(
        {\"user_id\": user[\"id\"], \"rating\": \"revise_again\", \"topics\": {\"$ne\": \"\"}},
        {\"_id\": 0, \"user_id\": 0}
    ).sort(\"created_at\", -1).limit(10)
    revise_items = await revise_cursor.to_list(10)
    revise_topics = [{\"subject\": i[\"subject_name\"], \"topics\": i[\"topics\"], \"date\": i[\"log_date\"]} for i in revise_items]

    # Focus subjects: subjects with low completion or many revise_again
    all_logs = await db.logs.find({\"user_id\": user[\"id\"]}, {\"_id\": 0, \"user_id\": 0}).to_list(10000)
    focus = []
    for s in user.get(\"subjects\", []):
        sid = s[\"id\"]
        s_logs = [i for i in all_logs if i[\"subject_id\"] == sid]
        revise_count = sum(1 for i in s_logs if i[\"rating\"] == \"revise_again\")
        total_min = sum(i[\"time_minutes\"] for i in s_logs)
        chapters_total = len(s.get(\"chapters\", [])) or 1
        unique_topics = set()
        for i in s_logs:
            if i[\"topics\"].strip():
                for t in i[\"topics\"].split(\",\"):
                    t = t.strip().lower()
                    if t:
                        unique_topics.add(t)
        completion = min(100, round(len(unique_topics) / chapters_total * 100)) if chapters_total else 0
        score = revise_count * 10 + max(0, 50 - completion) + max(0, 60 - total_min // 10)
        focus.append({
            \"subject_id\": sid,
            \"subject_name\": s[\"name\"],
            \"score\": score,
            \"completion\": completion,
            \"revise_count\": revise_count,
            \"total_minutes\": total_min,
        })
    focus.sort(key=lambda x: -x[\"score\"])
    return {
        \"missed_today\": not logged_today,
        \"missed_yesterday\": not logged_yesterday and logged_today is False,
        \"revise_topics\": revise_topics,
        \"focus_subjects\": focus[:3],
    }

# Health
@api.get(\"/\")
async def root():
    return {\"message\": \"StudyPulse API\", \"ok\": True}

app.include_router(api)

frontend_url = os.environ.get(\"FRONTEND_URL\", \"http://localhost:3000\")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, \"http://localhost:3000\"],
    allow_credentials=True,
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event(\"startup\")
async def startup():
    await db.users.create_index(\"email\", unique=True)
    await db.users.create_index(\"id\", unique=True)
    await db.logs.create_index([(\"user_id\", 1), (\"log_date\", -1)])
    # Seed admin
    admin_email = os.environ.get(\"ADMIN_EMAIL\", \"admin@studypulse.com\")
    admin_password = os.environ.get(\"ADMIN_PASSWORD\", \"admin123\")
    existing = await db.users.find_one({\"email\": admin_email})
    if not existing:
        await db.users.insert_one({
            \"id\": str(uuid.uuid4()),
            \"email\": admin_email,
            \"name\": \"Admin\",
            \"password_hash\": hash_password(admin_password),
            \"onboarded\": False,
            \"subjects\": [],
            \"target_score\": None,
            \"exam_date\": None,
            \"created_at\": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_password, existing[\"password_hash\"]):
        await db.users.update_one({\"email\": admin_email}, {\"$set\": {\"password_hash\": hash_password(admin_password)}})

@app.on_event(\"shutdown\")
async def shutdown():
    client.close()
"
Observation: Overwrite successful: /app/backend/server.py
