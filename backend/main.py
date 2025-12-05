import sqlite3
import random
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# --- CORS AYARLARI (Frontend erişimi için) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Her yerden erişime izin ver (Demo için)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_NAME = "bluppie.db"

# --- DB BAŞLATMA ---
def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Kullanıcılar
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (address TEXT PRIMARY KEY, balance_ton REAL, balance_pie REAL, xp INTEGER)''')
    # Envanter
    c.execute('''CREATE TABLE IF NOT EXISTS inventory 
                 (id INTEGER PRIMARY KEY, owner_address TEXT, name TEXT, item_number INTEGER, 
                  image_url TEXT, status TEXT, price REAL, currency TEXT)''')
    # DAO Oyları (Basit)
    c.execute('''CREATE TABLE IF NOT EXISTS votes 
                 (proposal_id INTEGER, voter_address TEXT, option_index INTEGER)''')
    conn.commit()
    conn.close()

init_db()

# --- MODELLER ---
class ListRequest(BaseModel):
    nft_id: int
    price: float
    currency: str

class BuyRequest(BaseModel):
    nft_id: int
    buyer_address: str

class VoteRequest(BaseModel):
    proposal_id: int
    voter_address: str
    option_index: int

# --- YARDIMCI ---
def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def seed_user(address: str):
    conn = get_db()
    c = conn.cursor()
    user = c.execute("SELECT * FROM users WHERE address = ?", (address,)).fetchone()
    if not user:
        # Yeni Kullanıcı Hediyeleri: 0 TON, 1000 PIE
        c.execute("INSERT INTO users VALUES (?, ?, ?, ?)", (address, 0, 1000, 0))
        # Hediye NFT
        c.execute("INSERT INTO inventory (owner_address, name, item_number, image_url, status, price, currency) VALUES (?, ?, ?, ?, ?, ?, ?)",
                  (address, "Starter Bluppie", random.randint(1000, 9999), "https://i.imgur.com/TDukTkX.png", "Owned", 0, "TON"))
        conn.commit()
    conn.close()

# --- API ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "Bluppie Backend Online 🚀"}

@app.get("/user/{address}")
def get_user(address: str):
    seed_user(address)
    conn = get_db()
    c = conn.cursor()
    
    user = c.execute("SELECT * FROM users WHERE address = ?", (address,)).fetchone()
    inventory = c.execute("SELECT * FROM inventory WHERE owner_address = ?", (address,)).fetchall()
    
    # Fake Transaction History
    txs = [{"id": 1, "type": "Gift", "item_name": "Starter Pack", "amount": "Free", "currency": "", "status": "Done"}]
    
    conn.close()
    return {
        "balance_ton": user["balance_ton"],
        "balance_pie": user["balance_pie"],
        "inventory": [dict(row) for row in inventory],
        "transactions": txs
    }

@app.get("/marketplace/{viewer_address}")
def get_market(viewer_address: str):
    conn = get_db()
    items = conn.execute("SELECT * FROM inventory WHERE status = 'Listed' AND owner_address != ?", (viewer_address,)).fetchall()
    conn.close()
    return [dict(row) for row in items]

@app.post("/marketplace/list")
def list_nft(req: ListRequest):
    conn = get_db()
    conn.execute("UPDATE inventory SET status = 'Listed', price = ?, currency = ? WHERE id = ?", 
                 (req.price, req.currency, req.nft_id))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.post("/marketplace/buy")
def buy_nft(req: BuyRequest):
    conn = get_db()
    c = conn.cursor()
    
    # NFT Kontrol
    item = c.execute("SELECT * FROM inventory WHERE id = ?", (req.nft_id,)).fetchone()
    if not item or item["status"] != "Listed":
        conn.close()
        raise HTTPException(status_code=400, detail="Item yok")
        
    price = item["price"]
    seller = item["owner_address"]
    buyer = req.buyer_address
    
    # PIE ile alınıyorsa bakiye transferi (Simüle)
    if item["currency"] == "PIE":
        buyer_data = c.execute("SELECT balance_pie FROM users WHERE address = ?", (buyer,)).fetchone()
        if buyer_data["balance_pie"] < price:
            conn.close()
            raise HTTPException(status_code=400, detail="Para yok")
        
        c.execute("UPDATE users SET balance_pie = balance_pie - ? WHERE address = ?", (price, buyer))
        c.execute("UPDATE users SET balance_pie = balance_pie + ? WHERE address = ?", (price, seller))

    # Sahiplik Değişimi
    c.execute("UPDATE inventory SET owner_address = ?, status = 'Owned', price = 0 WHERE id = ?", (buyer, req.nft_id))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.post("/marketplace/delist/{nft_id}")
def delist_nft(nft_id: int):
    conn = get_db()
    conn.execute("UPDATE inventory SET status = 'Owned', price = 0 WHERE id = ?", (nft_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/leaderboard")
def leaderboard():
    conn = get_db()
    # En zenginler listesi
    rows = conn.execute("SELECT address, balance_pie FROM users ORDER BY balance_pie DESC LIMIT 10").fetchall()
    conn.close()
    
    results = []
    for idx, row in enumerate(rows):
        addr = row["address"]
        short = addr[:4] + "..." + addr[-4:]
        badge = "👑" if idx == 0 else "💎" if idx < 3 else "🦈"
        results.append({"id": idx+1, "name": short, "score": row["balance_pie"], "badge": badge})
        
    return results

@app.post("/dao/vote")
def vote(req: VoteRequest):
    conn = get_db()
    conn.execute("INSERT INTO votes VALUES (?, ?, ?)", (req.proposal_id, req.voter_address, req.option_index))
    conn.commit()
    conn.close()
    return {"status": "success"}
