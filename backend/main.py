import sqlite3
import random
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# --- CORS AYARLARI ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_NAME = "bluppie.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (address TEXT PRIMARY KEY, balance_ton REAL, balance_pie REAL, xp INTEGER)''')
    c.execute('''CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY, owner_address TEXT, name TEXT, item_number INTEGER, image_url TEXT, status TEXT, price REAL, currency TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS votes (proposal_id INTEGER, voter_address TEXT, option_index INTEGER)''')
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

class MintRequest(BaseModel):
    owner_address: str
    name: str
    item_number: int  # Frontend'den 0 gelir, backend bunu görmezden gelir
    image_url: str

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
        # Yeni kullanıcı: 0 Bakiye, 0 NFT
        c.execute("INSERT INTO users VALUES (?, ?, ?, ?)", (address, 0, 0, 0))
        conn.commit()
    conn.close()

# --- ENDPOINTS ---
@app.get("/")
def read_root(): return {"status": "Bluppie Backend Live 🟢"}

@app.get("/user/{address}")
def get_user(address: str):
    seed_user(address)
    conn = get_db()
    c = conn.cursor()
    user = c.execute("SELECT * FROM users WHERE address = ?", (address,)).fetchone()
    inventory = c.execute("SELECT * FROM inventory WHERE owner_address = ?", (address,)).fetchall()
    conn.close()
    return {
        "balance_ton": user["balance_ton"],
        "balance_pie": user["balance_pie"],
        "inventory": [dict(row) for row in inventory],
        "transactions": []
    }

@app.get("/marketplace/{viewer_address}")
def get_market(viewer_address: str):
    conn = get_db()
    items = conn.execute("SELECT * FROM inventory WHERE status = 'Listed' AND owner_address != ?", (viewer_address,)).fetchall()
    conn.close()
    return [dict(row) for row in items]

# --- YENİ STATS ENDPOINT (BAR İÇİN) ---
@app.get("/stats")
def get_stats():
    conn = get_db()
    # Sadece Plush Bluppie olanları say
    count = conn.execute("SELECT COUNT(*) FROM inventory WHERE name = 'Plush Bluppie'").fetchone()[0]
    conn.close()
    return {"total_minted": count}

# --- GÜNCELLENMİŞ MINT (RASTGELE UNIQ ID) ---
@app.post("/mint")
def mint_nft(req: MintRequest):
    conn = get_db()
    c = conn.cursor()
    
    # 1. Şu ana kadar alınmış tüm ID'leri bul
    used_ids_query = c.execute("SELECT item_number FROM inventory WHERE name = 'Plush Bluppie'").fetchall()
    used_ids = {row[0] for row in used_ids_query}
    
    # 2. 1'den 1000'e kadar olan sayılardan boş olanları bul
    all_ids = set(range(1, 1001))
    available_ids = list(all_ids - used_ids)
    
    # 3. Yer kalmadıysa hata ver
    if not available_ids:
        conn.close()
        raise HTTPException(status_code=400, detail="SOLD OUT! Tükendi.")
    
    # 4. Rastgele bir tane seç
    random_id = random.choice(available_ids)
    
    # 5. Kaydet
    nft_unique_id = random.randint(1000000, 9999999) # DB için benzersiz satır ID'si
    c.execute("INSERT INTO inventory (id, owner_address, name, item_number, image_url, status, price, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                 (nft_unique_id, req.owner_address, "Plush Bluppie", random_id, req.image_url, "Owned", 0, "TON"))
    
    conn.commit()
    conn.close()
    
    return {"status": "success", "minted_id": random_id}

@app.post("/marketplace/list")
def list_nft(req: ListRequest):
    conn = get_db()
    item = conn.execute("SELECT * FROM inventory WHERE id = ?", (req.nft_id,)).fetchone()
    if not item:
        conn.close()
        raise HTTPException(status_code=404, detail="NFT Bulunamadı")
    conn.execute("UPDATE inventory SET status = 'Listed', price = ?, currency = ? WHERE id = ?", 
                 (req.price, req.currency, req.nft_id))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.post("/marketplace/buy")
def buy_nft(req: BuyRequest):
    conn = get_db()
    c = conn.cursor()
    item = c.execute("SELECT * FROM inventory WHERE id = ?", (req.nft_id,)).fetchone()
    if not item or item["status"] != "Listed":
        conn.close()
        raise HTTPException(status_code=400, detail="Item yok")
    
    price = item["price"]
    seller = item["owner_address"]
    buyer = req.buyer_address
    
    if item["currency"] == "PIE":
        buyer_data = c.execute("SELECT balance_pie FROM users WHERE address = ?", (buyer,)).fetchone()
        if buyer_data["balance_pie"] < price:
            conn.close()
            raise HTTPException(status_code=400, detail="Para yok")
        c.execute("UPDATE users SET balance_pie = balance_pie - ? WHERE address = ?", (price, buyer))
        c.execute("UPDATE users SET balance_pie = balance_pie + ? WHERE address = ?", (price, seller))

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
